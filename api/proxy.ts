// This file runs on Vercel's servers using Node.js runtime for longer execution time
import type { VercelRequest, VercelResponse } from "@vercel/node";

// The main function that handles requests to /api/proxy
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    // ** FIX: Destructure payload and the new 'stream' flag **
    const { payload, stream } = req.body;

    if (!payload) {
      return res
        .status(400)
        .json({ error: { message: "Request body payload is required" } });
    }

    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
      throw new Error("API_KEY is not set in the server environment.");
    }

    // ** FIX: Conditionally choose the correct Gemini endpoint **
    const endpoint = stream ? "streamGenerateContent" : "generateContent";
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:${endpoint}?key=${API_KEY}`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Send the original payload to Gemini
      body: JSON.stringify(payload),
    });

    // If Gemini returned an error, handle it.
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      return res.status(geminiResponse.status).json(errorData);
    }

    // ** FIX: Conditionally return either a stream or a full JSON object **
    if (stream) {
      // For streaming requests, return the body directly
      res.setHeader("Content-Type", "text/plain; charset=utf-8");

      if (geminiResponse.body) {
        const reader = geminiResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value));
        }
      }

      return res.end();
    } else {
      // For non-streaming requests, await the full JSON and return it
      const data = await geminiResponse.json();
      return res.status(200).json(data);
    }
  } catch (error: any) {
    console.error("Serverless function error:", error);
    return res
      .status(500)
      .json({
        error: { message: "Internal Server Error", details: error.message },
      });
  }
}
