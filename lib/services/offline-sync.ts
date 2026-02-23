/**
 * Offline-First Sync Service
 *
 * Bridges the fill screen with local SQLite storage and the remote API.
 *
 * FLOW:
 * 1. User starts filling survey → createDraftResponse() → saved in SQLite
 * 2. Each answer → saveAnswer() → auto-saved in SQLite (JSON column)
 * 3. User submits → submitResponse()
 *    a. Mark response as completed in SQLite
 *    b. Attempt API POST
 *    c. If online → mark as synced
 *    d. If offline → add to sync_queue, auto-sync later
 * 4. Network restored → processSyncQueue() → retry pending items
 */

import {
  submitBatchResponses,
  type SurveyResponseCreate,
} from "@/lib/api/mobile";
import { db } from "@/lib/db/database";
import { fileRepository } from "@/lib/db/repositories/file.repository";
import {
  responseRepository,
  type CreateResponseParams,
} from "@/lib/db/repositories/response.repository";
import { syncRepository } from "@/lib/db/repositories/sync.repository";
import { fileUploadService } from "@/lib/services/file-upload.service";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DraftResponseInput {
  surveyId: string;
  surveyVersion: string;
  userId: string;
  userName: string;
  userRole?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface SaveAnswerInput {
  responseId: string;
  questionId: number;
  value: any;
}

export interface SubmitResponseInput {
  responseId: string;
  versionId: number;
  startedAt: string;
  answers: {
    question_id: number;
    answer_value: any;
    answered_at: string;
    media_url?: string;
  }[];
}

export interface SyncResult {
  success: boolean;
  synced: boolean; // true if actually sent to server (vs saved locally)
  responseId: string;
  error?: string;
}

export interface TwoPhaseSubmitResult {
  success: boolean;
  responseId: string;
  queued: boolean;
  error?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

class OfflineSyncService {
  private initialized = false;

  /**
   * Ensure the database is ready
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await db.initialize();
      this.initialized = true;
      console.log("✅ OfflineSyncService initialized");
    } catch (error) {
      console.error("❌ OfflineSyncService init failed:", error);
      throw error;
    }
  }

  /**
   * 1. Create a draft response in local SQLite.
   *    Returns a response_id to use for auto-saving answers.
   */
  async createDraftResponse(input: DraftResponseInput): Promise<string> {
    await this.initialize();

    const responseId = Crypto.randomUUID();
    const appVersion = Application.nativeApplicationVersion ?? "unknown";
    const osVersion = Platform.Version?.toString() ?? "unknown";

    const params: CreateResponseParams = {
      response_id: responseId,
      survey_id: input.surveyId,
      survey_version: input.surveyVersion,
      brigadista_user_id: input.userId,
      brigadista_name: input.userName,
      brigadista_role: input.userRole ?? "brigadista",
      device_platform: Platform.OS as "android" | "ios" | "web",
      device_os_version: osVersion,
      device_app_version: appVersion,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
    };

    await responseRepository.createResponse(params);
    return responseId;
  }

  /**
   * 2. Auto-save an individual answer into the response's answers_json column.
   *    This is called on every answer change so no data is lost on crash/exit.
   */
  async saveAnswer(input: SaveAnswerInput): Promise<void> {
    try {
      // Get existing answers
      const existing = await responseRepository.getResponseById(
        input.responseId,
      );
      if (!existing) {
        console.warn(`⚠️ Response ${input.responseId} not found for auto-save`);
        return;
      }

      let answers: Record<string, any> = {};
      try {
        answers = JSON.parse(existing.answers_json || "{}");
      } catch {
        answers = {};
      }

      // Merge the new answer
      answers[String(input.questionId)] = input.value;

      await responseRepository.updateAnswers({
        response_id: input.responseId,
        answers: answers as any,
        autoSave: true,
      });
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
      // Don't throw — auto-save failure shouldn't block the user
    }
  }

  /**
   * 3. Submit a completed response.
   *    Saves locally first, then attempts API sync.
   */
  async submitResponse(input: SubmitResponseInput): Promise<SyncResult> {
    await this.initialize();

    const completedAt = new Date().toISOString();

    // Step A: Mark as completed locally
    try {
      await responseRepository.completeResponse(input.responseId);
    } catch (error) {
      console.error("❌ Failed marking response as completed:", error);
      // Continue anyway — the response was already saved as draft
    }

    // Step B: Build API payload
    const apiPayload: SurveyResponseCreate = {
      client_id: input.responseId,
      version_id: input.versionId,
      started_at: input.startedAt,
      completed_at: completedAt,
      answers: input.answers,
    };

    // Step C: Try API submission
    try {
      await submitBatchResponses(apiPayload);

      // Success → mark as synced
      await responseRepository.markAsSynced(input.responseId);

      console.log(`✅ Response ${input.responseId} synced immediately`);
      return { success: true, synced: true, responseId: input.responseId };
    } catch (apiError: any) {
      console.warn(
        `📵 API submission failed — queuing for later:`,
        apiError.message,
      );

      // Step D: Queue for later sync
      try {
        await syncRepository.addToQueue({
          queue_id: Crypto.randomUUID(),
          operation_type: "create_response",
          entity_type: "response",
          entity_id: input.responseId,
          payload: apiPayload,
          priority: 1, // High priority
        });

        await responseRepository.markSyncError(
          input.responseId,
          apiError.message ?? "Network error",
        );
      } catch (queueError) {
        console.error("❌ Failed to queue response for sync:", queueError);
      }

      return {
        success: true,
        synced: false,
        responseId: input.responseId,
        error: apiError.message,
      };
    }
  }

  /**
   * 3b. Two-phase submit:
   *   Phase 1 (instant): persist completion + queue operation locally
   *   Phase 2 (background): optional immediate queue processing if online
   *
   * Returns as soon as phase 1 finishes so UI can show instant confirmation.
   */
  async submitResponseTwoPhase(
    input: SubmitResponseInput,
    options?: { attemptImmediateSync?: boolean },
  ): Promise<TwoPhaseSubmitResult> {
    await this.initialize();

    const completedAt = new Date().toISOString();
    const apiPayload: SurveyResponseCreate = {
      client_id: input.responseId,
      version_id: input.versionId,
      started_at: input.startedAt,
      completed_at: completedAt,
      answers: input.answers,
    };

    try {
      await responseRepository.completeResponse(input.responseId);

      await syncRepository.addToQueue({
        queue_id: Crypto.randomUUID(),
        operation_type: "create_response",
        entity_type: "response",
        entity_id: input.responseId,
        payload: apiPayload,
        priority: 1,
      });

      if (options?.attemptImmediateSync) {
        setTimeout(() => {
          this.processSyncQueue().catch((err) => {
            console.warn("⚠️ Background sync failed:", err);
          });
        }, 0);
      }

      return {
        success: true,
        responseId: input.responseId,
        queued: true,
      };
    } catch (error: any) {
      return {
        success: false,
        responseId: input.responseId,
        queued: false,
        error: error?.message ?? "Failed to queue response",
      };
    }
  }

  /**
   * 4. Process the sync queue — called when network is restored.
   *    Returns the number of successfully synced items.
   */
  async processSyncQueue(): Promise<number> {
    await this.initialize();

    const pending = await syncRepository.getPendingOperations(50);
    if (pending.length === 0) return 0;

    console.log(`🔄 Processing ${pending.length} queued operations...`);
    let successCount = 0;

    // ── Phase 1: Batch all pending response submissions ───────────────────
    const responseItems = pending.filter(
      (i) => i.operation_type === "create_response",
    );
    const otherItems = pending.filter(
      (i) => i.operation_type !== "create_response",
    );

    if (responseItems.length > 0) {
      // Parse all payloads and group them into a true batch
      const payloads: SurveyResponseCreate[] = [];
      const itemMap: Map<string, (typeof responseItems)[0]> = new Map();

      for (const item of responseItems) {
        try {
          const payload = JSON.parse(item.payload_json) as SurveyResponseCreate;
          payloads.push(payload);
          itemMap.set(payload.client_id, item);
        } catch (parseErr) {
          console.error(
            `❌ Failed to parse payload for ${item.entity_id}:`,
            parseErr,
          );
          await syncRepository.markAsFailed(
            item.queue_id,
            "Invalid payload JSON",
          );
        }
      }

      if (payloads.length > 0) {
        try {
          // Submit all responses in a single API call
          const result = await submitBatchResponses(payloads);
          console.log(
            `📦 Batch result: ${result.successful}/${result.total} successful`,
          );

          // Mark each successful response
          for (const item of responseItems) {
            const matchingDetail = result.results?.find(
              (d) => d.client_id === item.entity_id,
            );

            if (matchingDetail && matchingDetail.status === "error") {
              await syncRepository.markAsFailed(
                item.queue_id,
                matchingDetail.message ?? "Server rejected",
              );
            } else {
              await syncRepository.markAsCompleted(item.queue_id);
              await responseRepository.markAsSynced(item.entity_id);
              successCount++;
            }
          }
        } catch (batchError: any) {
          console.error(`❌ Batch submission failed:`, batchError.message);
          // Fall back: try individual submissions
          for (const item of responseItems) {
            try {
              const payload = JSON.parse(
                item.payload_json,
              ) as SurveyResponseCreate;
              await submitBatchResponses(payload);
              await syncRepository.markAsCompleted(item.queue_id);
              await responseRepository.markAsSynced(item.entity_id);
              successCount++;
            } catch (individualError: any) {
              await syncRepository.markAsFailed(
                item.queue_id,
                individualError.message ?? "Unknown error",
              );
            }
          }
        }
      }
    }

    // ── Phase 2: Process file uploads and other operations ────────────────
    for (const item of otherItems) {
      try {
        if (item.operation_type === "upload_file") {
          // Upload pending files for this response
          const uploaded = await fileUploadService.uploadPendingFiles(10);
          await syncRepository.markAsCompleted(item.queue_id);
          successCount++;
          console.log(`✅ Uploaded ${uploaded} file(s) for: ${item.entity_id}`);
        } else {
          // Unknown operation type
          await syncRepository.markAsCompleted(item.queue_id);
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ Failed to sync ${item.entity_id}:`, error.message);
        await syncRepository.markAsFailed(
          item.queue_id,
          error.message ?? "Unknown error",
        );
      }
    }

    // ── Phase 3: Periodic cleanup of old uploaded files ───────────────────
    try {
      await fileUploadService.cleanupOldFiles(7);
    } catch {
      // Non-critical — don't fail the sync
    }

    console.log(`✅ Sync queue processed: ${successCount}/${pending.length}`);
    return successCount;
  }

  /**
   * Get pending sync count (for UI badge)
   */
  async getPendingSyncCount(): Promise<number> {
    try {
      await this.initialize();
      const stats = await syncRepository.getQueueStats();
      return (stats?.pending ?? 0) + (stats?.processing ?? 0);
    } catch {
      return 0;
    }
  }

  /**
   * Get draft responses for the current user (resume capability)
   */
  async getDraftResponses(userId: string) {
    await this.initialize();
    return responseRepository.getDraftResponses(userId);
  }

  /**
   * Delete a draft response that the user chose to discard.
   * Silently ignores errors so the app can always navigate back.
   */
  async deleteDraft(responseId: string): Promise<void> {
    try {
      await this.initialize();
      await responseRepository.deleteResponse(responseId);
      console.log("🗑️ Draft discarded:", responseId);
    } catch (err) {
      console.warn("⚠️ Could not delete draft:", err);
    }
  }

  /**
   * Save a file reference (photo, signature, INE) linked to a response
   * and queue it for upload.
   */
  async saveFileReference(params: {
    responseId: string;
    questionId: string;
    fileType: "photo" | "signature" | "ine_front" | "ine_back" | "file";
    localPath: string;
    fileName: string;
    mimeType: string;
    ocrData?: any;
  }): Promise<string> {
    await this.initialize();

    const fileId = Crypto.randomUUID();
    await fileRepository.createFile({
      file_id: fileId,
      response_id: params.responseId,
      file_type: params.fileType,
      question_id: params.questionId,
      local_path: params.localPath,
      file_name: params.fileName,
      mime_type: params.mimeType,
      ine_ocr_data: params.ocrData,
    });

    // Queue file upload in sync queue
    await syncRepository.addToQueue({
      queue_id: Crypto.randomUUID(),
      operation_type: "upload_file",
      entity_type: "file",
      entity_id: fileId,
      payload: { file_id: fileId, response_id: params.responseId },
      priority: 2, // Lower priority than response submission
    });

    return fileId;
  }

  // ── File-type question types ──────────────────────────────────────────────
  private static FILE_QUESTION_TYPES = new Set([
    "photo",
    "image",
    "signature",
    "ine",
    "ine_ocr",
    "credential",
    "file",
    "document",
  ]);

  /**
   * 5. Process file answers before submission.
   *
   * Iterates through all answers, identifies file-type questions,
   * registers each file via saveFileReference(), and returns a cleaned
   * answers array where:
   * - Raw file URIs / base64 are replaced with compact references
   * - Each answer gets a `media_url` placeholder ("pending_upload:<file_id>")
   *   that will be resolved to a Cloudinary URL after upload
   *
   * @param responseId - The draft response ID
   * @param answers - The raw answers array from handleSubmit
   * @param questionTypes - Map of question_id → question_type string
   * @returns Cleaned answers array with file references
   */
  async processFileAnswers(
    responseId: string,
    answers: SubmitResponseInput["answers"],
    questionTypes: Map<number, string>,
  ): Promise<SubmitResponseInput["answers"]> {
    await this.initialize();

    const processed: SubmitResponseInput["answers"] = [];

    for (const answer of answers) {
      const qType = questionTypes.get(answer.question_id) ?? "";

      if (!OfflineSyncService.FILE_QUESTION_TYPES.has(qType)) {
        // Non-file question — pass through unchanged
        processed.push(answer);
        continue;
      }

      try {
        const result = await this.processFileAnswer(responseId, answer, qType);
        processed.push(result);
      } catch (error) {
        console.error(
          `⚠️ Error processing file for Q${answer.question_id}:`,
          error,
        );
        // On error, keep original answer so data isn't lost
        processed.push(answer);
      }
    }

    return processed;
  }

  /**
   * Process a single file-type answer: register file(s) and clean the value.
   */
  private async processFileAnswer(
    responseId: string,
    answer: SubmitResponseInput["answers"][0],
    qType: string,
  ): Promise<SubmitResponseInput["answers"][0]> {
    const qId = String(answer.question_id);
    const value = answer.answer_value;

    if (value === null || value === undefined) {
      return answer;
    }

    // ── PHOTO: single file:// URI ──────────────────────────────
    if (qType === "photo" || qType === "image") {
      if (typeof value !== "string" || !value.startsWith("file://")) {
        return answer;
      }
      const fileId = await this.saveFileReference({
        responseId,
        questionId: qId,
        fileType: "photo",
        localPath: value,
        fileName: `photo_q${qId}_${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });
      return {
        ...answer,
        answer_value: { file_id: fileId, type: "photo" },
        media_url: `pending_upload:${fileId}`,
      };
    }

    // ── SIGNATURE: base64 data URI ──────────────────────────────
    if (qType === "signature") {
      if (typeof value !== "string") return answer;
      const fileId = await this.saveFileReference({
        responseId,
        questionId: qId,
        fileType: "signature",
        localPath: value, // data:image/png;base64,...
        fileName: `signature_q${qId}_${Date.now()}.png`,
        mimeType: "image/png",
      });
      return {
        ...answer,
        answer_value: { file_id: fileId, type: "signature" },
        media_url: `pending_upload:${fileId}`,
      };
    }

    // ── INE: { front, back, ocrData } ──────────────────────────
    if (qType === "ine" || qType === "ine_ocr" || qType === "credential") {
      const ineValue =
        typeof value === "string"
          ? { front: value, back: null, ocrData: null }
          : value;

      const fileIds: string[] = [];

      if (ineValue.front && typeof ineValue.front === "string") {
        const frontId = await this.saveFileReference({
          responseId,
          questionId: qId,
          fileType: "ine_front",
          localPath: ineValue.front,
          fileName: `ine_front_q${qId}_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          ocrData: ineValue.ocrData,
        });
        fileIds.push(frontId);
      }

      if (ineValue.back && typeof ineValue.back === "string") {
        const backId = await this.saveFileReference({
          responseId,
          questionId: qId,
          fileType: "ine_back",
          localPath: ineValue.back,
          fileName: `ine_back_q${qId}_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        });
        fileIds.push(backId);
      }

      return {
        ...answer,
        answer_value: {
          file_ids: fileIds,
          type: "ine",
          ocrData: ineValue.ocrData ?? null,
        },
        media_url:
          fileIds.length > 0
            ? `pending_upload:${fileIds.join(",")}`
            : undefined,
      };
    }

    // ── FILE: { uri, name, mimeType, size } ─────────────────────
    if (qType === "file" || qType === "document") {
      const fileValue =
        typeof value === "string"
          ? { uri: value, name: "file", mimeType: "application/octet-stream" }
          : value;

      if (!fileValue.uri) return answer;

      const fileId = await this.saveFileReference({
        responseId,
        questionId: qId,
        fileType: "file",
        localPath: fileValue.uri,
        fileName: fileValue.name ?? `file_q${qId}_${Date.now()}`,
        mimeType: fileValue.mimeType ?? "application/octet-stream",
      });
      return {
        ...answer,
        answer_value: {
          file_id: fileId,
          type: "file",
          name: fileValue.name,
        },
        media_url: `pending_upload:${fileId}`,
      };
    }

    return answer;
  }
}

export const offlineSyncService = new OfflineSyncService();
