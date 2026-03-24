/**
 * useMyResponses - Fetch and cache user responses
 * 
 * Implements stale-while-revalidate pattern:
 * 1. Load cache immediately if available
 * 2. Revalidate via API in background
 * 3. Only show error if cache empty + API failed
 */

import { useCallback, useEffect, useState } from "react";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { apiClient } from "@/lib/api/client";

const CACHE_KEY = "my_responses";
const CACHE_TTL = 3600000; // 1 hour

interface UseMyResponsesResult {
  responses: any[];
  isLoading: boolean;
  error: Error | null;
  hasRenderableData: boolean;
  refetch: () => Promise<void>;
  isEmpty: boolean;
}

export function useMyResponses(): UseMyResponsesResult {
  const { token } = useAuth();
  const { isOnline } = useSync();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasRenderableData, setHasRenderableData] = useState(false);

  const fetchResponses = useCallback(async () => {
    if (!token) {
      setError(new Error("Not authenticated"));
      setIsLoading(false);
      return;
    }

    try {
      // Phase 1: Load cache immediately
      const cached = await cacheRepository.get(CACHE_KEY, true); // stale=true
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setResponses(cached);
        setHasRenderableData(true);
        setIsLoading(false);
      }

      // Phase 2: Revalidate API if online
      if (!isOnline) {
        if (!cached || !Array.isArray(cached) || cached.length === 0) {
          setError(new Error("No cached data available offline"));
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get<any[]>(
          "/mobile/responses",
          {
            params: {
              limit: 100,
              offset: 0,
            },
          }
        );

        // Update cache with fresh data
        await cacheRepository.set(CACHE_KEY, data, CACHE_TTL);

        setResponses(data);
        setHasRenderableData(true);
        setError(null);
      } catch (apiError) {
        console.error("Error fetching responses:", apiError);

        // If we had cache, keep it and don't show error
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setResponses(cached);
          setHasRenderableData(true);
          // Silently fail if cache is available
        } else {
          setError(
            apiError instanceof Error
              ? apiError
              : new Error("Failed to fetch responses")
          );
          setHasRenderableData(false);
        }
      }
    } catch (err) {
      console.error("Error in useMyResponses:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [token, isOnline]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return {
    responses,
    isLoading: isLoading && !hasRenderableData,
    error: hasRenderableData ? null : error,
    hasRenderableData,
    refetch: fetchResponses,
    isEmpty: responses.length === 0,
  };
}
