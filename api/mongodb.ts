import { MongoClient, Db, ObjectId } from "mongodb";

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

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Save search session
    if (action === "saveSession" && req.method === "POST") {
      const body = await req.json();

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

      return new Response(
        JSON.stringify({
          success: true,
          sessionId: sessionResult.insertedId.toString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get all sessions
    if (action === "getSessions" && req.method === "GET") {
      const collection = db.collection("search_sessions");
      const sessions = await collection
        .find()
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return new Response(
        JSON.stringify({
          success: true,
          sessions,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get session by ID
    if (action === "getSession" && req.method === "GET") {
      const sessionId = searchParams.get("sessionId");
      const sessionCollection = db.collection("search_sessions");
      const resumeCollection = db.collection("resumes");

      const session = await sessionCollection.findOne({
        _id: new ObjectId(sessionId as string),
      });

      if (!session) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Session not found",
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Get resumes
      const resumeIds = session.analyzedResumes.map((ar: any) => ar.resumeId);
      const resumes = await resumeCollection
        .find({ _id: { $in: resumeIds } })
        .toArray();

      return new Response(
        JSON.stringify({
          success: true,
          session,
          resumes,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Delete session
    if (action === "deleteSession" && req.method === "DELETE") {
      const sessionId = searchParams.get("sessionId");
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

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Get statistics
    if (action === "getStats" && req.method === "GET") {
      const sessionId = searchParams.get("sessionId");
      const collection = db.collection("search_sessions");

      const session = await collection.findOne({
        _id: new ObjectId(sessionId as string),
      });

      if (!session) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Session not found",
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
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

      return new Response(
        JSON.stringify({
          success: true,
          stats: {
            totalResumes: session.totalResumes,
            acceptedCount,
            rejectedCount,
            averageScore,
            topSkills,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid action",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("MongoDB API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
