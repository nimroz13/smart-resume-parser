import { MongoClient, Db, ObjectId } from "mongodb";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = "resume_screener";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const action = req.query.action as string;

    // Save search session
    if (action === "saveSession" && req.method === "POST") {
      const body = req.body;

      const resumeCollection = db.collection("resumes");
      const sessionCollection = db.collection("search_sessions");

      // Save resumes
      const resumeIdMap = new Map<string, ObjectId>();
      for (const resume of body.resumes) {
        const resumeDoc = {
          resumeId: resume.id,
          fileName: resume.fileName,
          rawText: resume.text,
          parsedData: {},
          uploadedAt: new Date(),
        };
        const result = await resumeCollection.insertOne(resumeDoc);
        resumeIdMap.set(resume.id, result.insertedId);
      }

      // Create analyzed resumes
      const analyzedResumes = body.analysisResults.map((result: any) => ({
        resumeId: resumeIdMap.get(result.id),
        candidateName: result.name,
        matchScore: result.matchScore,
        justification: result.justification,
        extractedSkills: result.extractedSkills,
        extractedExperienceSummary: result.extractedExperienceSummary,
        status: result.matchScore >= 6 ? "accepted" : "rejected",
      }));

      // Create session
      const sessionDoc = {
        sessionId: `session_${Date.now()}`,
        jobDescription: body.jobDescription,
        jobDescriptionSource: {
          type: body.jdFileName
            ? "file"
            : body.jdPresetName
            ? "preset"
            : "text",
          fileName: body.jdFileName,
          presetName: body.jdPresetName,
        },
        createdAt: new Date(),
        totalResumes: body.resumes.length,
        analyzedResumes,
      };

      const sessionResult = await sessionCollection.insertOne(sessionDoc);

      // Update resumes with search reference
      await resumeCollection.updateMany(
        { _id: { $in: Array.from(resumeIdMap.values()) } },
        { $set: { searchId: sessionResult.insertedId } }
      );

      return res.status(200).json({
        success: true,
        sessionId: sessionResult.insertedId.toString(),
      });
    }

    // Get all sessions
    if (action === "getSessions" && req.method === "GET") {
      const collection = db.collection("search_sessions");
      const sessions = await collection
        .find()
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return res.status(200).json({
        success: true,
        sessions,
      });
    }

    // Get session by ID
    if (action === "getSession" && req.method === "GET") {
      const sessionId = req.query.sessionId as string;
      const sessionCollection = db.collection("search_sessions");
      const resumeCollection = db.collection("resumes");

      const session = await sessionCollection.findOne({
        _id: new ObjectId(sessionId as string),
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      // Get resumes
      const resumeIds = session.analyzedResumes.map((ar: any) => ar.resumeId);
      const resumes = await resumeCollection
        .find({ _id: { $in: resumeIds } })
        .toArray();

      return res.status(200).json({
        success: true,
        session,
        resumes,
      });
    }

    // Delete session
    if (action === "deleteSession" && req.method === "DELETE") {
      const sessionId = req.query.sessionId as string;
      const sessionCollection = db.collection("search_sessions");
      const resumeCollection = db.collection("resumes");

      const session = await sessionCollection.findOne({
        _id: new ObjectId(sessionId as string),
      });

      if (session) {
        const resumeIds = session.analyzedResumes.map((ar: any) => ar.resumeId);
        await resumeCollection.deleteMany({ _id: { $in: resumeIds } });
        await sessionCollection.deleteOne({
          _id: new ObjectId(sessionId as string),
        });
      }

      return res.status(200).json({ success: true });
    }

    // Get statistics
    if (action === "getStats" && req.method === "GET") {
      const sessionId = req.query.sessionId as string;
      const collection = db.collection("search_sessions");

      const session = await collection.findOne({
        _id: new ObjectId(sessionId as string),
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      const acceptedCount = session.analyzedResumes.filter(
        (r: any) => r.status === "accepted"
      ).length;
      const rejectedCount = session.analyzedResumes.filter(
        (r: any) => r.status === "rejected"
      ).length;
      const averageScore =
        session.analyzedResumes.reduce(
          (sum: number, r: any) => sum + r.matchScore,
          0
        ) / session.analyzedResumes.length;

      const skillCounts = new Map<string, number>();
      session.analyzedResumes.forEach((resume: any) => {
        resume.extractedSkills.forEach((skill: string) => {
          skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        });
      });

      const topSkills = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return res.status(200).json({
        success: true,
        stats: {
          totalResumes: session.totalResumes,
          acceptedCount,
          rejectedCount,
          averageScore,
          topSkills,
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: "Invalid action",
    });
  } catch (error: any) {
    console.error("MongoDB API error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
