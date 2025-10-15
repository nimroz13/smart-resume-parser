import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry, Resume, Candidate } from "../types";

const HISTORY_STORAGE_KEY = "resumeScreenerHistory";

export const useHistory = (): {
  history: HistoryEntry[];
  addHistoryEntry: (
    data: Omit<HistoryEntry, "id" | "timestamp" | "title">
  ) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
} => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
      setHistory([]);
    }
  }, []);

  const saveHistory = useCallback((newHistory: HistoryEntry[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
    }
  }, []);

  const addHistoryEntry = useCallback(
    (data: {
      jobDescription: string;
      jdFileName?: string | null;
      jdPresetName?: string | null;
      resumes: Resume[];
      analysisResults: Candidate[];
    }) => {
      const {
        jobDescription,
        jdFileName,
        jdPresetName,
        resumes,
        analysisResults,
      } = data;

      // Generate a title from the first non-empty line of the job description
      const title =
        jobDescription
          .split("\n")
          .find((line) => line.trim() !== "")
          ?.trim() || "Untitled Screening";

      const newEntry: HistoryEntry = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: title.length > 50 ? `${title.substring(0, 50)}...` : title,
        jobDescription,
        jdFileName,
        jdPresetName,
        resumes,
        analysisResults,
      };

      saveHistory([newEntry, ...history]);
    },
    [history, saveHistory]
  );

  const removeHistoryEntry = useCallback(
    (id: string) => {
      const updatedHistory = history.filter((entry) => entry.id !== id);
      saveHistory(updatedHistory);
    },
    [history, saveHistory]
  );

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return { history, addHistoryEntry, removeHistoryEntry, clearHistory };
};
