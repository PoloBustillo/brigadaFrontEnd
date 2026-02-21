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
   * 4. Process the sync queue — called when network is restored.
   *    Returns the number of successfully synced items.
   */
  async processSyncQueue(): Promise<number> {
    await this.initialize();

    const pending = await syncRepository.getPendingOperations(20);
    if (pending.length === 0) return 0;

    console.log(`🔄 Processing ${pending.length} queued operations...`);
    let successCount = 0;

    for (const item of pending) {
      try {
        if (item.operation_type === "create_response") {
          const payload = JSON.parse(item.payload_json) as SurveyResponseCreate;

          await submitBatchResponses(payload);

          // Mark synced
          await syncRepository.markAsCompleted(item.queue_id);
          await responseRepository.markAsSynced(item.entity_id);

          successCount++;
          console.log(`✅ Synced queued response: ${item.entity_id}`);
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
   */
  async saveFileReference(params: {
    responseId: string;
    questionId: string;
    fileType: "photo" | "signature" | "ine_front" | "ine_back";
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

    return fileId;
  }
}

export const offlineSyncService = new OfflineSyncService();
