/**
 * File Upload Service — Cloudinary Direct Upload
 *
 * FLOW:
 * 1. Get signed upload params from backend → POST /mobile/documents/upload
 * 2. Upload file directly to Cloudinary using FormData
 * 3. Update local_files record via FileRepository (markAsUploaded)
 *
 * Called by:
 * - processSyncQueue() when processing `upload_file` operations
 * - Manual sync triggered by user
 */

import { APP_CONFIG } from "@/constants/config";
import { apiClient } from "@/lib/api/client";
import {
  fileRepository,
  type FileRecord,
} from "@/lib/db/repositories/file.repository";
import * as FileSystem from "expo-file-system";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocumentMetadata {
  document_type: string;
  question_id?: number;
  ocr_confidence?: number;
  ocr_text?: string;
}

interface SignedUploadParams {
  document_id: string;
  upload_url: string;
  expires_at: string;
  ocr_required: boolean;
  low_confidence_warning: boolean;
  cloudinary_signature: string;
  cloudinary_timestamp: number;
  cloudinary_api_key: string;
  cloudinary_public_id: string;
  cloudinary_folder: string;
}

export interface FileUploadResult {
  success: boolean;
  fileId: string;
  remoteUrl?: string;
  cloudinaryPublicId?: string;
  error?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

class FileUploadService {
  /**
   * Upload a single file to Cloudinary via signed upload.
   *
   * Steps:
   * 1. Mark file as "uploading" in SQLite
   * 2. Request signed params from backend
   * 3. Upload file directly to Cloudinary
   * 4. Mark file as "uploaded" with remote URL
   */
  async uploadFile(file: FileRecord): Promise<FileUploadResult> {
    const fileId = file.file_id;

    try {
      // Step 1: Mark as uploading
      await fileRepository.markAsUploading(fileId);

      // Step 2: Resolve the file content (base64 data URIs need special handling)
      const { filePath, fileSize, mimeType } =
        await this.resolveFileContent(file);

      // Step 3: Get signed upload params from backend
      const docType = this.mapFileTypeToDocType(file.file_type);
      const questionIdNum = parseInt(file.question_id, 10);

      const signedParams = await this.getSignedUploadParams({
        clientId: file.response_id,
        fileName: file.file_name,
        fileSize,
        mimeType,
        metadata: {
          document_type: docType,
          question_id: isNaN(questionIdNum) ? undefined : questionIdNum,
          ocr_confidence: file.ine_ocr_data
            ? JSON.parse(file.ine_ocr_data)?.confidence
            : undefined,
        },
      });

      // Step 4: Upload to Cloudinary
      const cloudinaryResponse = await this.uploadToCloudinary(
        filePath,
        mimeType,
        signedParams,
      );

      const remoteUrl = cloudinaryResponse.secure_url;
      const publicId = cloudinaryResponse.public_id;
      const version = cloudinaryResponse.version;

      // Step 5: Mark as uploaded in SQLite
      await fileRepository.markAsUploaded(fileId, publicId, remoteUrl, version);

      // Step 6: Clean up temporary files if we created any
      if (
        filePath !== file.local_path &&
        filePath.includes(FileSystem.cacheDirectory ?? "__none__")
      ) {
        FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
      }

      console.log(`✅ File ${fileId} uploaded → ${remoteUrl}`);
      return { success: true, fileId, remoteUrl, cloudinaryPublicId: publicId };
    } catch (error: any) {
      console.error(`❌ File upload failed for ${fileId}:`, error.message);
      await fileRepository
        .markUploadError(fileId, error.message ?? "Upload failed")
        .catch(() => {});
      return { success: false, fileId, error: error.message };
    }
  }

  /**
   * Upload all pending files (batch).
   * Returns count of successfully uploaded files.
   */
  async uploadPendingFiles(limit = 10): Promise<number> {
    const pendingFiles = await fileRepository.getPendingFiles(limit);
    if (pendingFiles.length === 0) return 0;

    console.log(`📤 Uploading ${pendingFiles.length} pending files...`);
    let successCount = 0;

    for (const file of pendingFiles) {
      const result = await this.uploadFile(file);
      if (result.success) successCount++;
    }

    console.log(`✅ File upload batch: ${successCount}/${pendingFiles.length}`);
    return successCount;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Resolve file content — handles both local file paths and base64 data URIs.
   * Signatures are stored as base64 data URIs — we need to write them to a temp file.
   */
  private async resolveFileContent(
    file: FileRecord,
  ): Promise<{ filePath: string; fileSize: number; mimeType: string }> {
    const localPath = file.local_path ?? "";

    // Case 1: base64 data URI (signatures) — write to temp file
    if (localPath.startsWith("data:")) {
      const base64Data = localPath.split(",")[1];
      if (!base64Data) throw new Error("Invalid base64 data URI");

      const tempPath = `${FileSystem.cacheDirectory}upload_${file.file_id}.png`;
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const info = await FileSystem.getInfoAsync(tempPath);
      return {
        filePath: tempPath,
        fileSize: (info as any).size ?? 0,
        mimeType: "image/png",
      };
    }

    // Case 2: Local file path
    const info = await FileSystem.getInfoAsync(localPath);
    if (!info.exists) throw new Error(`File not found: ${localPath}`);

    return {
      filePath: localPath,
      fileSize: (info as any).size ?? file.file_size,
      mimeType: file.mime_type,
    };
  }

  /**
   * Request signed upload params from backend.
   */
  private async getSignedUploadParams(params: {
    clientId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    metadata: DocumentMetadata;
  }): Promise<SignedUploadParams> {
    const { data } = await apiClient.post<SignedUploadParams>(
      "/mobile/documents/upload",
      {
        client_id: params.clientId,
        file_name: params.fileName,
        file_size: params.fileSize,
        mime_type: params.mimeType,
        metadata: params.metadata,
      },
      { timeout: APP_CONFIG.api.timeout },
    );
    return data;
  }

  /**
   * Upload file directly to Cloudinary using the signed params.
   * Uses FileSystem.uploadAsync for efficient native upload.
   */
  private async uploadToCloudinary(
    filePath: string,
    mimeType: string,
    params: SignedUploadParams,
  ): Promise<{ secure_url: string; public_id: string; version: number }> {
    // Build FormData with all required Cloudinary signed upload fields
    const uploadResult = await FileSystem.uploadAsync(
      params.upload_url,
      filePath,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        parameters: {
          api_key: params.cloudinary_api_key,
          timestamp: String(params.cloudinary_timestamp),
          signature: params.cloudinary_signature,
          public_id: params.cloudinary_public_id,
        },
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      const errorBody = uploadResult.body ? JSON.parse(uploadResult.body) : {};
      throw new Error(
        `Cloudinary upload failed (${uploadResult.status}): ${errorBody?.error?.message ?? "Unknown error"}`,
      );
    }

    const body = JSON.parse(uploadResult.body);
    return {
      secure_url: body.secure_url,
      public_id: body.public_id,
      version: body.version,
    };
  }

  /**
   * Map internal file_type to backend document_type.
   */
  private mapFileTypeToDocType(fileType: string): string {
    const mapping: Record<string, string> = {
      photo: "photo",
      signature: "signature",
      ine_front: "id_card",
      ine_back: "id_card",
      file: "form",
    };
    return mapping[fileType] ?? "photo";
  }
}

export const fileUploadService = new FileUploadService();
