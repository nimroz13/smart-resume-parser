// Client-side service for MongoDB operations via API

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3100/api/mongodb"
  : "/api/mongodb";

export interface SaveSessionData {
  jobDescription: string;
  jdFileName?: string | null;
  jdPresetName?: string | null;
  resumes: Array<{
    id: string;
    fileName: string;
    text: string;
  }>;
  analysisResults: Array<{
    id: string;
    name: string;
    matchScore: number;
    justification: string;
    extractedSkills: string[];
    extractedExperienceSummary: string;
  }>;
}

export interface SearchSession {
  _id: string;
  sessionId: string;
  jobDescription: string;
  jobDescriptionSource: {
    type: "text" | "file" | "preset";
    fileName?: string;
    presetName?: string;
  };
  createdAt: string;
  totalResumes: number;
  analyzedResumes: Array<{
    resumeId: string;
    candidateName: string;
    matchScore: number;
    justification: string;
    extractedSkills: string[];
    extractedExperienceSummary: string;
    status: "accepted" | "rejected";
  }>;
}

export interface SessionStatistics {
  totalResumes: number;
  acceptedCount: number;
  rejectedCount: number;
  averageScore: number;
  topSkills: Array<{ skill: string; count: number }>;
}

// Save a new search session to MongoDB
export async function saveSearchSessionToMongo(
  data: SaveSessionData
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}?action=saveSession`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to save session");
    }

    return result.sessionId;
  } catch (error) {
    console.error("Error saving session to MongoDB:", error);
    throw error;
  }
}

// Get all search sessions
export async function getAllSearchSessionsFromMongo(): Promise<
  SearchSession[]
> {
  try {
    const response = await fetch(`${API_BASE_URL}?action=getSessions`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch sessions");
    }

    return result.sessions;
  } catch (error) {
    console.error("Error fetching sessions from MongoDB:", error);
    throw error;
  }
}

// Get a specific session by ID
export async function getSearchSessionFromMongo(sessionId: string): Promise<{
  session: SearchSession;
  resumes: any[];
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}?action=getSession&sessionId=${sessionId}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch session");
    }

    return {
      session: result.session,
      resumes: result.resumes,
    };
  } catch (error) {
    console.error("Error fetching session from MongoDB:", error);
    throw error;
  }
}

// Delete a search session
export async function deleteSearchSessionFromMongo(
  sessionId: string
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}?action=deleteSession&sessionId=${sessionId}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to delete session");
    }
  } catch (error) {
    console.error("Error deleting session from MongoDB:", error);
    throw error;
  }
}

// Get session statistics
export async function getSessionStatistics(
  sessionId: string
): Promise<SessionStatistics> {
  try {
    const response = await fetch(
      `${API_BASE_URL}?action=getStats&sessionId=${sessionId}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch statistics");
    }

    return result.stats;
  } catch (error) {
    console.error("Error fetching statistics from MongoDB:", error);
    throw error;
  }
}
