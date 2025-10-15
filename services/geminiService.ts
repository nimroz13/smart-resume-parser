import type {
  Candidate,
  Resume,
  ConsultantMessage,
  ResumeBuilderData,
} from "../types";

// Check if we're in development mode
const isDevelopment = import.meta.env?.DEV ?? false;
const API_KEY = ((process.env as any).API_KEY ||
  (process.env as any).GEMINI_API_KEY) as string;

/**
 * A generic function to call our secure serverless proxy or directly call Gemini in dev mode.
 * This is the ONLY function that communicates with the backend.
 * @param body The request body to send to the Gemini API via our proxy.
 * @param stream Whether to handle a streaming response.
 * @returns The JSON response from the Gemini API or the assembled text from a stream.
 */
const callApiProxy = async (
  body: object,
  stream: boolean = false
): Promise<any> => {
  // In development, call Gemini directly
  if (isDevelopment && API_KEY) {
    const endpoint = stream ? "streamGenerateContent" : "generateContent";
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:${endpoint}?key=${API_KEY}`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    // Handle streaming vs. non-streaming responses
    if (stream) {
      if (!response.body) {
        throw new Error("Streaming response not available.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);

        const matches = chunk.matchAll(/"text"\s*:\s*"([^"]*)"/g);
        for (const match of matches) {
          try {
            fullText += JSON.parse(`"${match[1]}"`);
          } catch (e) {
            console.error("Failed to parse chunk text:", match[1]);
          }
        }
      }
      return fullText;
    } else {
      return response.json();
    }
  }

  // In production, use the proxy
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // ** FIX: Send the payload and the stream flag to the intelligent proxy **
    body: JSON.stringify({ payload: body, stream }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorBody = JSON.parse(errorText);
      console.error("API Proxy Error (JSON):", errorBody);
      throw new Error(
        errorBody.error?.message ||
          "An error occurred while communicating with the API."
      );
    } catch (jsonError) {
      console.error("API Proxy Error (Text):", errorText);
      throw new Error(errorText || "An unknown HTTP error occurred.");
    }
  }

  // Handle streaming vs. non-streaming responses from our proxy
  if (stream) {
    if (!response.body) {
      throw new Error("Streaming response not available.");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);

      const matches = chunk.matchAll(/"text"\s*:\s*"([^"]*)"/g);
      for (const match of matches) {
        try {
          fullText += JSON.parse(`"${match[1]}"`);
        } catch (e) {
          console.error("Failed to parse chunk text:", match[1]);
        }
      }
    }
    return fullText;
  } else {
    // If not streaming, we expect a single JSON object.
    return response.json();
  }
};

export const analyzeResumes = async (
  jobDescription: string,
  resumes: Resume[]
): Promise<Candidate[]> => {
  const resumeTexts = resumes
    .map(
      (r) =>
        `--- RESUME START ---\nID: ${r.id}\nFILENAME: ${r.fileName}\n\n${r.text}\n--- RESUME END ---`
    )
    .join("\n\n");

  const prompt = `
    You are an expert technical recruiter and hiring manager with years of experience. Your task is to analyze a list of resumes against a given job description and provide a structured JSON output.

    JOB DESCRIPTION:
    ${jobDescription}

    RESUMES TO ANALYZE:
    ${resumeTexts}

    INSTRUCTIONS:
    1.  Carefully read the Job Description to understand the key requirements, skills, and experience needed.
    2.  For each resume, perform the following analysis:
        a.  Identify the candidate's name. If no name is found, use the filename or "Unknown Candidate".
        b.  Calculate a "matchScore" from 1 to 10, where 1 is a very poor match and 10 is a perfect match. The score should be based on the alignment of the candidate's skills and experience with the job description.
        c.  Write a concise "justification" (2-3 sentences) explaining the reasoning behind the matchScore.
        d.  Extract a list of the most relevant "extractedSkills" from the resume that match the job description.
        e.  Provide a brief "extractedExperienceSummary" (2-3 sentences) summarizing their relevant work history.
    3.  You MUST provide the output in a valid JSON array format. Do not include any text or markdown formatting before or after the JSON array. The JSON schema for each object in the array should be:
    {
      "id": "string (use the resume ID from the input)",
      "name": "string",
      "matchScore": "number (integer from 1-10)",
      "justification": "string",
      "extractedSkills": ["string"],
      "extractedExperienceSummary": "string"
    }
  `;

  try {
    // This function requires a full JSON object, so it does NOT stream.
    const response = await callApiProxy(
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      },
      false
    ); // stream = false

    // The Gemini API response for JSON mode is nested.
    const jsonText = response.candidates[0].content.parts[0].text;
    const parsedData: Candidate[] = JSON.parse(jsonText);
    return parsedData;
  } catch (error) {
    console.error("Failed to analyze resumes:", error);
    if (error instanceof SyntaxError) {
      throw new Error(
        "Could not parse the analysis from the AI model. The response was not valid JSON."
      );
    }
    throw error;
  }
};

export const askQuestionAboutResume = async (
  resumeText: string,
  question: string,
  jobDescription: string
): Promise<string> => {
  const prompt = `
    You are an expert career coach and hiring manager. Your task is to provide insightful answers to questions about a candidate's resume, considering the context of a specific job description. Be helpful, insightful, and constructive. Go beyond what is just written in the resume and provide strategic advice.

    JOB DESCRIPTION CONTEXT:
    ${jobDescription}

    CANDIDATE'S RESUME:
    ${resumeText}

    USER'S QUESTION:
    ${question}

    YOUR INSIGHTFUL ANSWER:
  `;
  return callApiProxy({ contents: [{ parts: [{ text: prompt }] }] }, true); // stream = true
};

export const askConsultant = async (
  jobDescription: string,
  resumes: Resume[],
  messages: ConsultantMessage[]
): Promise<string> => {
  const resumeFileNames = resumes.map((r) => r.fileName).join(", ") || "None";
  const conversationHistory = messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = `
    You are an AI-powered Career and Recruitment Consultant. You have been provided with the context of a job description, a list of resume filenames that have been uploaded, and the current conversation history. Your goal is to provide expert advice.

    CONTEXT:
    - Job Description: ${jobDescription || "Not provided yet."}
    - Resumes Uploaded: ${resumeFileNames}
    - Conversation History:
    ${conversationHistory}

    Based on all available context, provide a helpful and concise answer to the user's last message. Do not repeat the context in your answer.
  `;
  return callApiProxy({ contents: [{ parts: [{ text: prompt }] }] }, true); // stream = true
};

export const generateResumeFromDetails = async (
  data: ResumeBuilderData
): Promise<string> => {
  const experienceSection = data.workExperience
    .map(
      (exp) =>
        `Company: ${exp.company}\nJob Title: ${exp.jobTitle}\nDates: ${exp.startDate} - ${exp.endDate}\nResponsibilities:\n${exp.responsibilities}`
    )
    .join("\n\n");

  const educationSection = data.education
    .map(
      (edu) =>
        `School: ${edu.school}\nDegree: ${edu.degree}\nDates: ${edu.startDate} - ${edu.endDate}`
    )
    .join("\n\n");

  const prompt = `
    You are a professional resume writer. Your task is to generate a complete, well-formatted resume in plain text based on the structured data provided by a user. Use strong action verbs and a professional tone.

    USER DATA:
    - Full Name: ${data.fullName}
    - Email: ${data.email}
    - Phone Number: ${data.phoneNumber}
    - Address: ${data.address}
    - Professional Summary: ${data.summary}
    - Work Experience:\n${experienceSection}
    - Education:\n${educationSection}
    - Skills: ${data.skills}

    Generate the complete resume text based on the data above. Ensure clean formatting with clear headings (e.g., SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS). Do not include any introductory or concluding text. Just provide the resume content itself.
  `;
  return callApiProxy({ contents: [{ parts: [{ text: prompt }] }] }, true); // stream = true
};
