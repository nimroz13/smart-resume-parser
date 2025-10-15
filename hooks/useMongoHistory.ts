import { useState, useEffect, useCallback } from "react";
import {
  getAllSearchSessionsFromMongo,
  deleteSearchSessionFromMongo,
} from "../services/mongoClient";
import type { HistoryEntry, Resume, Candidate } from "../types";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const useMongoHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const loadHistory = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAllSearchSessionsFromMongo(page, 5);

      // Transform MongoDB sessions to HistoryEntry format
      const transformedHistory: HistoryEntry[] = result.sessions.map(
        (session) => {
          // Generate title from job description
          const title =
            session.jobDescription
              .split("\n")
              .find((line) => line.trim() !== "")
              ?.trim() || "Untitled Screening";

          // Transform analyzed resumes to Candidate format
          const analysisResults: Candidate[] = session.analyzedResumes.map(
            (ar) => ({
              id: ar.resumeId,
              name: ar.candidateName,
              matchScore: ar.matchScore,
              justification: ar.justification,
              extractedSkills: ar.extractedSkills,
              extractedExperienceSummary: ar.extractedExperienceSummary,
            })
          );

          // Create empty resumes array (we don't need full resume text for history display)
          const resumes: Resume[] = session.analyzedResumes.map((ar) => ({
            id: ar.resumeId,
            fileName: "", // We'll need to fetch this if needed
            text: "",
          }));

          return {
            id: session._id,
            timestamp: session.createdAt,
            title: title.length > 50 ? `${title.substring(0, 50)}...` : title,
            jobDescription: session.jobDescription,
            jdFileName: session.jobDescriptionSource.fileName || null,
            jdPresetName: session.jobDescriptionSource.presetName || null,
            resumes,
            analysisResults,
          };
        }
      );

      setHistory(transformedHistory);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error("Failed to load history from MongoDB:", err);
      setError(err.message || "Failed to load history");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial history
  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  const removeHistoryEntry = useCallback(
    async (id: string) => {
      try {
        await deleteSearchSessionFromMongo(id);
        // Reload current page
        await loadHistory(pagination.page);
      } catch (err: any) {
        console.error("Failed to delete session:", err);
        setError(err.message || "Failed to delete session");
      }
    },
    [loadHistory, pagination.page]
  );

  const clearHistory = useCallback(async () => {
    // Not implementing full clear for safety
    // User can delete individual entries
    console.log("Clear all not implemented for MongoDB history");
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      loadHistory(pagination.page + 1);
    }
  }, [loadHistory, pagination]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      loadHistory(pagination.page - 1);
    }
  }, [loadHistory, pagination]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        loadHistory(page);
      }
    },
    [loadHistory, pagination.totalPages]
  );

  return {
    history,
    isLoading,
    error,
    pagination,
    removeHistoryEntry,
    clearHistory,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => loadHistory(pagination.page),
  };
};
