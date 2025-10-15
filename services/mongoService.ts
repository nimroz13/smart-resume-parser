import { MongoClient, Db, ObjectId } from "mongodb";

// MongoDB connection string - will be stored in environment variables
const MONGODB_URI =
  import.meta.env.VITE_MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "resume_screener";

let client: MongoClient | null = null;
let db: Db | null = null;

// Connect to MongoDB
export async function connectToMongoDB(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB successfully");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Close MongoDB connection
export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// ===== TYPES =====

export interface MongoResume {
  _id?: ObjectId;
  resumeId: string; // Original frontend ID
  fileName: string;
  rawText: string;
  parsedData: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  };
  uploadedAt: Date;
  searchId?: ObjectId; // Reference to the search session
}

export interface MongoSearchSession {
  _id?: ObjectId;
  sessionId: string; // Original frontend ID
  jobDescription: string;
  jobDescriptionSource: {
    type: "text" | "file" | "preset";
    fileName?: string;
    presetName?: string;
  };
  createdAt: Date;
  totalResumes: number;
  analyzedResumes: MongoAnalyzedResume[];
}

export interface MongoAnalyzedResume {
  resumeId: ObjectId; // Reference to Resume document
  candidateName: string;
  matchScore: number;
  justification: string;
  extractedSkills: string[];
  extractedExperienceSummary: string;
  status: "accepted" | "rejected";
}

// ===== RESUME OPERATIONS =====

export async function saveResume(resume: {
  resumeId: string;
  fileName: string;
  rawText: string;
  parsedData?: any;
}): Promise<ObjectId> {
  const database = await connectToMongoDB();
  const collection = database.collection<MongoResume>("resumes");

  const resumeDoc: MongoResume = {
    resumeId: resume.resumeId,
    fileName: resume.fileName,
    rawText: resume.rawText,
    parsedData: resume.parsedData || {},
    uploadedAt: new Date(),
  };

  const result = await collection.insertOne(resumeDoc);
  return result.insertedId;
}

export async function getResumeById(
  resumeId: string
): Promise<MongoResume | null> {
  const database = await connectToMongoDB();
  const collection = database.collection<MongoResume>("resumes");
  return await collection.findOne({ resumeId });
}

export async function getAllResumes(): Promise<MongoResume[]> {
  const database = await connectToMongoDB();
  const collection = database.collection<MongoResume>("resumes");
  return await collection.find().sort({ uploadedAt: -1 }).toArray();
}

// ===== SEARCH SESSION OPERATIONS =====

export async function saveSearchSession(session: {
  sessionId: string;
  jobDescription: string;
  jobDescriptionSource: {
    type: "text" | "file" | "preset";
    fileName?: string;
    presetName?: string;
  };
  resumes: Array<{
    resumeId: string;
    fileName: string;
    rawText: string;
  }>;
  analysisResults: Array<{
    id: string;
    name: string;
    matchScore: number;
    justification: string;
    extractedSkills: string[];
    extractedExperienceSummary: string;
  }>;
}): Promise<ObjectId> {
  const database = await connectToMongoDB();
  const resumeCollection = database.collection<MongoResume>("resumes");
  const sessionCollection =
    database.collection<MongoSearchSession>("search_sessions");

  // Save all resumes and get their MongoDB IDs
  const resumeIdMap = new Map<string, ObjectId>();

  for (const resume of session.resumes) {
    const resumeDoc: MongoResume = {
      resumeId: resume.resumeId,
      fileName: resume.fileName,
      rawText: resume.rawText,
      parsedData: {},
      uploadedAt: new Date(),
    };

    const result = await resumeCollection.insertOne(resumeDoc);
    resumeIdMap.set(resume.resumeId, result.insertedId);
  }

  // Create analyzed resumes with MongoDB resume references
  const analyzedResumes: MongoAnalyzedResume[] = session.analysisResults.map(
    (result) => {
      const mongoResumeId = resumeIdMap.get(result.id);
      if (!mongoResumeId) {
        throw new Error(`Resume ID ${result.id} not found in map`);
      }

      return {
        resumeId: mongoResumeId,
        candidateName: result.name,
        matchScore: result.matchScore,
        justification: result.justification,
        extractedSkills: result.extractedSkills,
        extractedExperienceSummary: result.extractedExperienceSummary,
        status: result.matchScore >= 6 ? "accepted" : "rejected",
      };
    }
  );

  // Update resumes with search reference
  for (const [resumeId, mongoId] of resumeIdMap.entries()) {
    await resumeCollection.updateOne(
      { _id: mongoId },
      { $set: { searchId: undefined } } // Will be updated after session is created
    );
  }

  // Create search session
  const sessionDoc: MongoSearchSession = {
    sessionId: session.sessionId,
    jobDescription: session.jobDescription,
    jobDescriptionSource: session.jobDescriptionSource,
    createdAt: new Date(),
    totalResumes: session.resumes.length,
    analyzedResumes,
  };

  const result = await sessionCollection.insertOne(sessionDoc);

  // Update all resumes with the search session ID
  const searchSessionId = result.insertedId;
  await resumeCollection.updateMany(
    { _id: { $in: Array.from(resumeIdMap.values()) } },
    { $set: { searchId: searchSessionId } }
  );

  return searchSessionId;
}

export async function getSearchSessionById(
  sessionId: string
): Promise<MongoSearchSession | null> {
  const database = await connectToMongoDB();
  const collection = database.collection<MongoSearchSession>("search_sessions");
  return await collection.findOne({ sessionId });
}

export async function getAllSearchSessions(): Promise<MongoSearchSession[]> {
  const database = await connectToMongoDB();
  const collection = database.collection<MongoSearchSession>("search_sessions");
  return await collection.find().sort({ createdAt: -1 }).toArray();
}

export async function getSearchSessionWithResumes(sessionId: string): Promise<{
  session: MongoSearchSession;
  resumes: MongoResume[];
} | null> {
  const database = await connectToMongoDB();
  const sessionCollection =
    database.collection<MongoSearchSession>("search_sessions");
  const resumeCollection = database.collection<MongoResume>("resumes");

  const session = await sessionCollection.findOne({ sessionId });
  if (!session) return null;

  // Get all resume IDs from analyzed resumes
  const resumeIds = session.analyzedResumes.map((ar) => ar.resumeId);
  const resumes = await resumeCollection
    .find({ _id: { $in: resumeIds } })
    .toArray();

  return { session, resumes };
}

export async function deleteSearchSession(sessionId: string): Promise<boolean> {
  const database = await connectToMongoDB();
  const sessionCollection =
    database.collection<MongoSearchSession>("search_sessions");
  const resumeCollection = database.collection<MongoResume>("resumes");

  const session = await sessionCollection.findOne({ sessionId });
  if (!session) return false;

  // Delete associated resumes
  const resumeIds = session.analyzedResumes.map((ar) => ar.resumeId);
  await resumeCollection.deleteMany({ _id: { $in: resumeIds } });

  // Delete session
  await sessionCollection.deleteOne({ sessionId });

  return true;
}

// ===== STATISTICS =====

export async function getSearchStatistics(sessionId: string): Promise<{
  totalResumes: number;
  acceptedCount: number;
  rejectedCount: number;
  averageScore: number;
  topSkills: { skill: string; count: number }[];
}> {
  const database = await connectToMongoDB();
  const collection = database.collection<MongoSearchSession>("search_sessions");

  const session = await collection.findOne({ sessionId });
  if (!session) {
    throw new Error("Session not found");
  }

  const acceptedCount = session.analyzedResumes.filter(
    (r) => r.status === "accepted"
  ).length;
  const rejectedCount = session.analyzedResumes.filter(
    (r) => r.status === "rejected"
  ).length;

  const averageScore =
    session.analyzedResumes.reduce((sum, r) => sum + r.matchScore, 0) /
    session.analyzedResumes.length;

  // Count skill occurrences
  const skillCounts = new Map<string, number>();
  session.analyzedResumes.forEach((resume) => {
    resume.extractedSkills.forEach((skill) => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    });
  });

  const topSkills = Array.from(skillCounts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalResumes: session.totalResumes,
    acceptedCount,
    rejectedCount,
    averageScore,
    topSkills,
  };
}
