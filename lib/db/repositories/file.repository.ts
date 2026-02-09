/**
 * File Repository
 *
 * Gestiona archivos locales y su sincronización con Cloudinary
 *
 * ARQUITECTURA:
 * - Archivos se capturan offline y guardan en FileSystem local
 * - Metadata se guarda en SQLite
 * - Upload se hace a Cloudinary (NO a backend directamente)
 * - Backend genera firma de upload (signed upload)
 * - Solo metadata se guarda en PostgreSQL
 */

import * as FileSystem from "expo-file-system";
import { db } from "../database";

/**
 * Registro de archivo local (local_files table)
 */
export interface FileRecord {
  file_id: string; // UUID
  response_id: string;
  file_type: "photo" | "signature" | "ine_front" | "ine_back" | "file";
  question_id: string;
  local_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;

  // Cloudinary metadata (después de upload)
  cloudinary_public_id: string | null;
  cloudinary_version: number | null;
  remote_url: string | null; // Cloudinary secure_url

  // OCR data (solo para INE)
  ine_ocr_data: string | null; // JSON string

  // Sync status
  sync_status: "pending" | "uploading" | "uploaded" | "error";
  uploaded_at: string | null;

  // Thumbnail
  thumbnail_path: string | null;

  // Timestamps
  created_at: string;
}

/**
 * Parámetros para crear archivo
 */
export interface CreateFileParams {
  file_id: string;
  response_id: string;
  file_type: FileRecord["file_type"];
  question_id: string;
  local_path: string;
  file_name: string;
  mime_type: string;
  ine_ocr_data?: any; // Se serializa a JSON
}

/**
 * Repositorio para gestión de archivos locales y Cloudinary
 *
 * FLUJO DE UPLOAD:
 * 1. createFile() - Guarda archivo localmente + metadata en SQLite
 * 2. (Cuando hay conexión) Request upload permission del backend
 * 3. Upload directo a Cloudinary con signed params
 * 4. markAsUploaded() - Actualiza metadata con Cloudinary info
 */
export class FileRepository {
  /**
   * Guardar referencia de archivo en BD (captura offline)
   *
   * NOTA: El archivo ya debe existir en FileSystem antes de llamar esto
   */
  async createFile(params: CreateFileParams): Promise<string> {
    const connection = db.getConnection();

    // Obtener tamaño del archivo
    let file_size = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(params.local_path);
      if (fileInfo.exists && "size" in fileInfo) {
        file_size = fileInfo.size;
      }
    } catch (error) {
      console.error("Error getting file size:", error);
    }

    const sql = `
      INSERT INTO local_files (
        file_id, response_id, file_type, question_id,
        local_path, file_name, file_size, mime_type,
        ine_ocr_data, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    await connection.runAsync(sql, [
      params.file_id,
      params.response_id,
      params.file_type,
      params.question_id,
      params.local_path,
      params.file_name,
      file_size,
      params.mime_type,
      params.ine_ocr_data ? JSON.stringify(params.ine_ocr_data) : null,
    ]);

    console.log(
      `✅ File saved locally: ${params.file_name} (${params.file_type})`,
    );
    console.log(`   Path: ${params.local_path}`);
    console.log(`   Size: ${(file_size / 1024).toFixed(2)} KB`);

    return params.file_id;
  }

  /**
   * Obtener archivo por ID
   */
  async getFileById(fileId: string): Promise<FileRecord | null> {
    const connection = db.getConnection();

    const sql = `
      SELECT * FROM local_files
      WHERE file_id = ?
    `;

    const result = await connection.getFirstAsync<FileRecord>(sql, [fileId]);
    return result || null;
  }

  /**
   * Obtener archivos por respuesta
   */
  async getFilesByResponse(responseId: string): Promise<FileRecord[]> {
    const connection = db.getConnection();

    const sql = `
      SELECT * FROM local_files
      WHERE response_id = ?
      ORDER BY created_at ASC
    `;

    const result = await connection.getAllAsync<FileRecord>(sql, [responseId]);
    return result;
  }

  /**
   * Obtener archivos pendientes de subir
   */
  async getPendingFiles(limit: number = 10): Promise<FileRecord[]> {
    const connection = db.getConnection();

    const sql = `
      SELECT * FROM local_files
      WHERE sync_status IN ('pending', 'error')
      ORDER BY created_at ASC
      LIMIT ?
    `;

    const result = await connection.getAllAsync<FileRecord>(sql, [limit]);
    return result;
  }

  /**
   * Marcar archivo como subido exitosamente a Cloudinary
   *
   * @param fileId - ID del archivo
   * @param cloudinaryPublicId - Public ID de Cloudinary
   * @param cloudinarySecureUrl - Secure URL de Cloudinary
   * @param cloudinaryVersion - Version de Cloudinary
   */
  async markAsUploaded(
    fileId: string,
    cloudinaryPublicId: string,
    cloudinarySecureUrl: string,
    cloudinaryVersion?: number,
  ): Promise<void> {
    const connection = db.getConnection();

    const sql = `
      UPDATE local_files
      SET sync_status = 'uploaded',
          cloudinary_public_id = ?,
          remote_url = ?,
          cloudinary_version = ?,
          uploaded_at = datetime('now')
      WHERE file_id = ?
    `;

    await connection.runAsync(sql, [
      cloudinaryPublicId,
      cloudinarySecureUrl,
      cloudinaryVersion || null,
      fileId,
    ]);

    console.log(`✅ File marked as uploaded to Cloudinary: ${fileId}`);
    console.log(`   Public ID: ${cloudinaryPublicId}`);
    console.log(`   Secure URL: ${cloudinarySecureUrl}`);
  }

  /**
   * Actualizar status a "uploading" (durante el upload)
   */
  async markAsUploading(fileId: string): Promise<void> {
    const connection = db.getConnection();

    const sql = `
      UPDATE local_files
      SET sync_status = 'uploading'
      WHERE file_id = ?
    `;

    await connection.runAsync(sql, [fileId]);
    console.log(`📤 File marked as uploading: ${fileId}`);
  }

  /**
   * Marcar error de subida
   */
  async markUploadError(fileId: string, error: string): Promise<void> {
    const connection = db.getConnection();

    const sql = `
      UPDATE local_files
      SET sync_status = 'error'
      WHERE file_id = ?
    `;

    await connection.runAsync(sql, [fileId]);
    console.error(`❌ File upload error: ${fileId} - ${error}`);
  }

  /**
   * Actualizar datos OCR de INE
   */
  async updateOcrData(fileId: string, ocrData: any): Promise<void> {
    const connection = db.getConnection();

    const sql = `
      UPDATE local_files
      SET ine_ocr_data = ?
      WHERE file_id = ?
    `;

    await connection.runAsync(sql, [JSON.stringify(ocrData), fileId]);
    console.log(`✅ OCR data updated: ${fileId}`);
  }

  /**
   * Generar y guardar thumbnail
   */
  async createThumbnail(
    fileId: string,
    originalPath: string,
  ): Promise<string | null> {
    try {
      // TODO: Implementar generación de thumbnail
      // Por ahora, solo actualizar path si existe

      const thumbnailPath = originalPath.replace(/\.[^.]+$/, "_thumb.jpg");

      const connection = db.getConnection();

      const sql = `
        UPDATE local_files
        SET thumbnail_path = ?
        WHERE file_id = ?
      `;

      await connection.runAsync(sql, [thumbnailPath, fileId]);

      console.log(`✅ Thumbnail created: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      console.error("Error creating thumbnail:", error);
      return null;
    }
  }

  /**
   * Eliminar archivo (BD + físico)
   */
  async deleteFile(fileId: string): Promise<void> {
    const connection = db.getConnection();

    // 1. Obtener info del archivo
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // 2. No permitir eliminar si ya está subido
    if (file.sync_status === "uploaded") {
      throw new Error("Cannot delete uploaded file");
    }

    // 3. Eliminar archivo físico
    try {
      const fileInfo = await FileSystem.getInfoAsync(file.local_path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(file.local_path, { idempotent: true });
      }

      // Eliminar thumbnail si existe
      if (file.thumbnail_path) {
        const thumbInfo = await FileSystem.getInfoAsync(file.thumbnail_path);
        if (thumbInfo.exists) {
          await FileSystem.deleteAsync(file.thumbnail_path, {
            idempotent: true,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting physical file:", error);
    }

    // 4. Eliminar registro de BD
    const sql = `DELETE FROM local_files WHERE file_id = ?`;
    await connection.runAsync(sql, [fileId]);

    console.log(`🗑️ File deleted: ${fileId}`);
  }

  /**
   * Obtener estadísticas de archivos
   */
  async getFileStats(userId?: string): Promise<{
    total: number;
    pending: number;
    uploaded: number;
    error: number;
    totalSize: number;
  }> {
    const connection = db.getConnection();

    let sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN sync_status = 'uploaded' THEN 1 ELSE 0 END) as uploaded,
        SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) as error,
        SUM(file_size) as totalSize
      FROM local_files
    `;

    if (userId) {
      sql += `
        WHERE response_id IN (
          SELECT response_id FROM responses
          WHERE brigadista_user_id = ?
        )
      `;
    }

    const result = await connection.getFirstAsync<{
      total: number;
      pending: number;
      uploaded: number;
      error: number;
      totalSize: number;
    }>(sql, userId ? [userId] : []);

    return (
      result || {
        total: 0,
        pending: 0,
        uploaded: 0,
        error: 0,
        totalSize: 0,
      }
    );
  }

  /**
   * Limpiar archivos antiguos ya subidos (liberar espacio)
   */
  async cleanupUploadedFiles(daysOld: number = 7): Promise<number> {
    const connection = db.getConnection();

    // 1. Obtener archivos antiguos subidos
    const sql = `
      SELECT * FROM local_files
      WHERE sync_status = 'uploaded'
        AND uploaded_at <= datetime('now', '-${daysOld} days')
    `;

    const files = await connection.getAllAsync<FileRecord>(sql);

    let deletedCount = 0;

    // 2. Eliminar archivos físicos
    for (const file of files) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(file.local_path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(file.local_path, { idempotent: true });
          deletedCount++;
        }

        // Eliminar thumbnail
        if (file.thumbnail_path) {
          const thumbInfo = await FileSystem.getInfoAsync(file.thumbnail_path);
          if (thumbInfo.exists) {
            await FileSystem.deleteAsync(file.thumbnail_path, {
              idempotent: true,
            });
          }
        }
      } catch (error) {
        console.error(`Error deleting file ${file.file_id}:`, error);
      }
    }

    // 3. Actualizar BD (marcar como limpiado)
    const updateSql = `
      UPDATE local_files
      SET local_path = NULL, thumbnail_path = NULL
      WHERE sync_status = 'uploaded'
        AND uploaded_at <= datetime('now', '-${daysOld} days')
    `;

    await connection.runAsync(updateSql);

    console.log(`🧹 Cleaned up ${deletedCount} uploaded files`);
    return deletedCount;
  }

  /**
   * Obtener archivos INE por respuesta
   */
  async getIneFiles(responseId: string): Promise<{
    front: FileRecord | null;
    back: FileRecord | null;
  }> {
    const connection = db.getConnection();

    const sql = `
      SELECT * FROM local_files
      WHERE response_id = ?
        AND file_type IN ('ine_front', 'ine_back')
    `;

    const files = await connection.getAllAsync<FileRecord>(sql, [responseId]);

    return {
      front: files.find((f) => f.file_type === "ine_front") || null,
      back: files.find((f) => f.file_type === "ine_back") || null,
    };
  }

  /**
   * Obtener archivos subidos a Cloudinary por respuesta
   */
  async getUploadedFilesByResponse(responseId: string): Promise<FileRecord[]> {
    const connection = db.getConnection();

    const sql = `
      SELECT * FROM local_files
      WHERE response_id = ?
        AND sync_status = 'uploaded'
        AND cloudinary_public_id IS NOT NULL
      ORDER BY uploaded_at DESC
    `;

    const result = await connection.getAllAsync<FileRecord>(sql, [responseId]);
    return result;
  }

  /**
   * Verificar si todos los archivos de una respuesta están subidos
   */
  async areAllFilesUploaded(responseId: string): Promise<boolean> {
    const connection = db.getConnection();

    const sql = `
      SELECT COUNT(*) as total,
             SUM(CASE WHEN sync_status = 'uploaded' THEN 1 ELSE 0 END) as uploaded
      FROM local_files
      WHERE response_id = ?
    `;

    const result = await connection.getFirstAsync<{
      total: number;
      uploaded: number;
    }>(sql, [responseId]);

    if (!result || result.total === 0) {
      return true; // No hay archivos = consideramos OK
    }

    return result.total === result.uploaded;
  }

  /**
   * Obtener URLs de Cloudinary para una respuesta
   * Útil para mostrar galería de imágenes
   */
  async getCloudinaryUrls(responseId: string): Promise<
    {
      file_id: string;
      file_type: string;
      secure_url: string;
      public_id: string;
    }[]
  > {
    const connection = db.getConnection();

    const sql = `
      SELECT 
        file_id,
        file_type,
        remote_url as secure_url,
        cloudinary_public_id as public_id
      FROM local_files
      WHERE response_id = ?
        AND sync_status = 'uploaded'
        AND remote_url IS NOT NULL
      ORDER BY created_at ASC
    `;

    const result = await connection.getAllAsync<{
      file_id: string;
      file_type: string;
      secure_url: string;
      public_id: string;
    }>(sql, [responseId]);

    return result;
  }
}

/**
 * Singleton instance
 */
export const fileRepository = new FileRepository();
