// This file runs on Vercel's servers, not in the browser.
// We are using the native fetch API.

// Vercel specific configuration to use the Edge runtime for speed.
export const config = {
  runtime: 'edge',
};

// The main function that handles requests to /api/proxy
export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // ** FIX: Destructure payload and the new 'stream' flag **
    const { payload, stream } = await req.json();

    if (!payload) {
      return new Response(JSON.stringify({ error: { message: 'Request body payload is required' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
      throw new Error("API_KEY is not set in the server environment.");
    }
    
    // ** FIX: Conditionally choose the correct Gemini endpoint **
    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:${endpoint}?key=${API_KEY}`;
    
    const geminiResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Send the original payload to Gemini
        body: JSON.stringify(payload),
    });

    // If Gemini returned an error, handle it.
    if (!geminiResponse.ok) {
       const errorData = await geminiResponse.json();
       return new Response(JSON.stringify(errorData), {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // ** FIX: Conditionally return either a stream or a full JSON object **
    if (stream) {
      // For streaming requests, return the body directly.
      return new Response(geminiResponse.body, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } else {
      // For non-streaming requests, await the full JSON and return it.
      const data = await geminiResponse.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error("Serverless function error:", error);
    return new Response(JSON.stringify({ error: { message: 'Internal Server Error', details: error.message } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
