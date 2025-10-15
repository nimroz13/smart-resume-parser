# Smart Resume Screener

An AI-powered resume screening application for streamlined recruitment with intelligent candidate analysis, persistent data storage, and a modern UI. Built with React, TypeScript, MongoDB, and powered by Google Gemini AI.


[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0%20Flash-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)

> **Note:** The domain name was changed during deployment, but both URLs remain accessible:
> - Original: [smart-resume-parser-five.vercel.app](https://smart-resume-parser-five.vercel.app/)
> - Current: [nimroz13-smart-resume-screener.vercel.app](https://nimroz13-smart-resume-screener.vercel.app/)

---

## Video Demonstration

Watch the full application demo on Google Drive:

**[📹 View Video Demonstration](https://drive.google.com/file/d/1LeSyKQVWKku1W9VVDrcLZTLDiHx7yu86/view?usp=drive_link )**

---

## Gemini AI Prompt

This is the actual prompt used to analyze resumes with Google Gemini AI:

```
You are an expert technical recruiter and hiring manager with years of experience. Your task is to analyze a list of resumes against a given job description and provide a structured JSON output.

JOB DESCRIPTION:
${jobDescription}

RESUMES TO ANALYZE:
${resumeTexts}

INSTRUCTIONS:
1. Carefully read the Job Description to understand the key requirements, skills, and experience needed.
2. For each resume, perform the following analysis:
   a. Identify the candidate's name. If no name is found, use the filename or "Unknown Candidate".
   b. Calculate a "matchScore" from 1 to 10, where 1 is a very poor match and 10 is a perfect match. The score should be based on the alignment of the candidate's skills and experience with the job description.
   c. Write a concise "justification" (2-3 sentences) explaining the reasoning behind the matchScore.
   d. Extract a list of the most relevant "extractedSkills" from the resume that match the job description.
   e. Provide a brief "extractedExperienceSummary" (2-3 sentences) summarizing their relevant work history.
3. You MUST provide the output in a valid JSON array format. Do not include any text or markdown formatting before or after the JSON array.

JSON Schema:
{
  "id": "string (use the resume ID from the input)",
  "name": "string",
  "matchScore": "number (integer from 1-10)",
  "justification": "string",
  "extractedSkills": ["string"],
  "extractedExperienceSummary": "string"
}
```

---

## Key Features

### 3-Page Workflow

1. **Upload Page** – Input job descriptions and upload candidate resumes
2. **Analysis Page** – View detailed AI-powered candidate analysis with scoring
3. **History Page** – Access previous screening sessions with pagination (MongoDB)

### AI-Powered Analysis

- Upload multiple resumes (`.txt`, `.pdf`, `.docx`) for AI analysis
- 10-point match scoring with detailed justification
- Automatic skill extraction and experience summarization
- Accept/Reject categorization (score ≥6 = Accepted)

### Flexible Job Description Input

- Type directly, upload files (PDF, DOC, DOCX, TXT), or select from 30+ preset templates
- Drag & drop support for intuitive file upload

### MongoDB Cloud Storage

- All screening data saved to MongoDB Atlas
- Paginated history (5 sessions per page) for fast performance
- Scalable and accessible across devices

### Performance & UX

- Auto-reset inputs after each analysis
- Resume filename tracking
- Loading states and error handling
- Responsive design for desktop, tablet, and mobile

---

## System Architecture

### Frontend Application

- **React 19, TypeScript, Vite** for fast, modern development
- **Modular Components:**
  - `Header.tsx` - Navigation between 3 pages
  - `JobDescriptionInput.tsx` - Multi-input JD handling (text/file/preset)
  - `ResumeInput.tsx` - Drag-and-drop resume upload with file tracking
  - `ResumeScoreTable.tsx` - Accepted/Rejected candidate overview
  - `CandidateCard.tsx` - Detailed candidate analysis
  - `MongoHistorySidebar.tsx` - Paginated session history from MongoDB
- **Custom Hooks:**
  - `useMongoHistory.ts` - MongoDB session management with pagination
- **Client-Side File Parsing:** Privacy-focused approach using `pdf.js` and `mammoth.js`
- **Styling:** Clean, modern UI with Tailwind CSS

### Serverless Backend (Vercel Functions)

Node.js serverless functions for Gemini AI proxy and MongoDB API operations.

**1. Gemini AI Proxy (`api/proxy.ts`)**

- Proxies requests to Google Gemini API with secure API key management
- Handles streaming and non-streaming responses
- Environment Variable: `API_KEY`

**2. MongoDB API (`api/mongodb.ts`)**

- RESTful API for database operations
- Endpoints:
  - `POST /api/mongodb?action=saveSession` - Save new screening session
  - `GET /api/mongodb?action=getSessions&page=1&limit=5` - Get paginated sessions
  - `GET /api/mongodb?action=getSession&sessionId=xxx` - Get single session with resumes
  - `DELETE /api/mongodb?action=deleteSession&sessionId=xxx` - Delete session
  - `GET /api/mongodb?action=getStats&sessionId=xxx` - Get session statistics
- Environment Variable: `MONGODB_URI`

### MongoDB Database

MongoDB Atlas cloud database for persistent, scalable storage.

#### Collections

**1. `resumes` Collection**

```javascript
{
  _id: ObjectId,
  resumeId: "resume_123",
  fileName: "john_doe_resume.pdf",
  rawText: "Full resume text...",
  parsedData: { name, email, phone, skills, experience, education },
  uploadedAt: ISODate,
  searchId: ObjectId  // Reference to search_sessions
}
```

**2. `search_sessions` Collection**

```javascript
{
  _id: ObjectId,
  sessionId: "session_1234567890",
  jobDescription: "Full JD text...",
  jobDescriptionSource: {
    type: "text" | "file" | "preset",
    fileName: "jd.pdf",
    presetName: "Senior React Developer"
  },
  createdAt: ISODate,
  totalResumes: 5,
  analyzedResumes: [
    {
      resumeId: ObjectId,  // Reference to resumes collection
      candidateName: "John Doe",
      matchScore: 8,
      justification: "Strong match...",
      extractedSkills: ["React", "TypeScript"],
      extractedExperienceSummary: "5 years experience...",
      status: "accepted" | "rejected"
    }
  ]
}
```

#### Database Features

- Server-side pagination (5 items per page) for fast queries
- Optimized indexes on `createdAt`, `sessionId`, `resumeId`
- ObjectId references between collections
- Cloud hosted on MongoDB Atlas free tier (512MB storage)

---

## AI Integration

### Google Gemini 2.0 Flash Experimental

Fast, accurate AI model optimized for resume analysis with structured JSON output.

- **Model:** `gemini-2.0-flash-exp`
- **Response Time:** ~2-5 seconds for multi-resume analysis
- **Context Window:** Large enough for job descriptions + multiple resumes
- **JSON Mode:** Structured output for reliable parsing

### Prompt Engineering Strategy

- **Persona:** Expert technical recruiter with 10+ years experience
- **Clear Context:** Job description and resume text with clear delimiters
- **Structured Instructions:** Analyze fit, extract skills, summarize experience, provide scores
- **Enforced JSON Schema:** Guarantees parseable responses

### Response Format

```json
{
  "id": "resume_123",
  "name": "John Doe",
  "matchScore": 8,
  "justification": "Strong match with 5+ years React experience, extensive TypeScript knowledge...",
  "extractedSkills": ["React", "TypeScript", "Node.js", "MongoDB", "Git"],
  "extractedExperienceSummary": "Senior Full-Stack Developer with proven track record..."
}
```

### Analysis Workflow

```
User uploads JD + Resumes
         ↓
Client-side file parsing (pdf.js/mammoth)
         ↓
Send to /api/proxy (Gemini API)
         ↓
AI analyzes each resume against JD
         ↓
Returns structured JSON response
         ↓
Display results in Analysis page
         ↓
Save to MongoDB for history
```

---

## Getting Started

### Prerequisites

- Node.js (v20.x or higher)
- Google Gemini API Key
- MongoDB Atlas Account (free tier works)

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/nimroz13/smart-resume-screener.git
cd smart-resume-screener
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up MongoDB Atlas**

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account and cluster
   - Create database user with read/write permissions
   - Whitelist your IP (or allow all: `0.0.0.0/0`)
   - Get your connection string

4. **Set up environment variables**

   Create a `.env` file in the root directory:

```env
# Gemini AI API Key (for frontend)
API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/resume_screener?retryWrites=true&w=majority
```

5. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3100`

### Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google Account
3. Click **"Get API key"** → **"Create API key"**
4. Copy and save your API key securely

## Deployment to Vercel

### Quick Deploy

1. **Fork/Push this repository** to your GitHub account

2. **Deploy to Vercel**

   - Go to [Vercel.com](https://vercel.com) and sign up with GitHub
   - Click **"Add New..." → "Project"**
   - Import your repository
   - Vercel will auto-detect settings (Vite)

3. **Configure Environment Variables**

   In Vercel project settings → Environment Variables, add:

   | Variable Name         | Value                          | Description             |
   | --------------------- | ------------------------------ | ----------------------- |
   | `API_KEY`             | Your Gemini API Key            | For serverless function |
   | `VITE_GEMINI_API_KEY` | Your Gemini API Key            | For frontend            |
   | `MONGODB_URI`         | Your MongoDB connection string | Include database name   |

   **Important:**

   - URL-encode special characters in password (`@` → `%40`)
   - Apply to all environments (Production, Preview, Development)

4. **Deploy**

   - Click **"Deploy"**
   - Wait 2-3 minutes for build
   - You'll receive a live URL like: `https://your-app.vercel.app`

5. **Verify Deployment**
   - Test the app
   - Check console for "Session saved to MongoDB successfully"
   - View data in MongoDB Atlas → Browse Collections

### Build Settings (Auto-detected)

```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 20.x
```

### Function Configuration

The `vercel.json` file configures serverless functions:

```json
{
  "functions": {
    "api/mongodb.ts": {
      "memory": 1024,
      "maxDuration": 10
    },
    "api/proxy.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## Tech Stack

### Frontend

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6.2.0
- **Styling:** Tailwind CSS (CDN)
- **File Parsing:** pdf.js 4.4.168, mammoth.js 1.8.0

### Backend

- **Serverless Functions:** Vercel Node.js Runtime
- **API Proxy:** Custom Gemini API proxy
- **Database API:** RESTful MongoDB API endpoints

### AI & Database

- **AI Model:** Google Gemini 2.0 Flash Experimental
- **Database:** MongoDB Atlas (Cloud)
- **Driver:** mongodb 6.x

### Deployment

- **Platform:** Vercel
- **CI/CD:** Automatic deployment from GitHub
- **Edge Network:** Global CDN for fast loading

---

## Project Structure

```
smart-resume-screener/
├── api/
│   ├── mongodb.ts                  # MongoDB serverless API
│   └── proxy.ts                    # Gemini API proxy
├── components/
│   ├── Header.tsx                  # Navigation header (3 pages)
│   ├── JobDescriptionInput.tsx     # Multi-input JD handler
│   ├── ResumeInput.tsx             # Drag-drop resume upload
│   ├── ResumeScoreTable.tsx        # Accepted/Rejected table
│   ├── CandidateCard.tsx           # Detailed candidate view
│   ├── MongoHistorySidebar.tsx     # Paginated history (NEW)
│   ├── HistorySidebar.tsx          # localStorage history (backup)
│   └── icons/                      # SVG icon components
├── hooks/
│   └── useMongoHistory.ts          # MongoDB history management
├── services/
│   ├── geminiService.ts            # AI integration
│   ├── mongoService.ts             # MongoDB CRUD operations
│   ├── mongoClient.ts              # MongoDB API client
│   ├── fileParsers.ts              # Client-side file parsing
│   └── presetRoles.ts              # 30+ job templates
├── App.tsx                         # Main application orchestrator
├── types.ts                        # TypeScript interfaces
├── vercel.json                     # Vercel function configuration
└── index.html                      # Entry point with Tailwind
```

---

## Features Breakdown

### Page 1: Upload

**Job Description Input (Left Panel):**

- Type directly in textarea
- Upload file (PDF, DOC, DOCX, TXT) with drag-and-drop
- Select from 30+ preset templates (Senior Developer, Product Manager, etc.)
- Tracks source (file name or preset name)

**Resume Upload (Right Panel):**

- Drag-and-drop multiple resumes
- Support for TXT, PDF, DOCX formats
- Displays filename for each resume
- Add more resumes anytime
- Remove individual resumes

**Action Button:**

- "Analyze Resumes & Continue" - Triggers AI analysis
- Shows loading spinner during processing
- Auto-navigates to Analysis page on success

---

### Page 2: Analysis

**Job Description Display:**

- Full job description shown at top
- Source badge (File: jd.pdf or Template: Senior React Developer)

**Resume Score Table:**

- **Accepted Column** (Score ≥ 6): Green highlight
- **Rejected Column** (Score < 6): Red highlight
- Each card shows: Name, Score, Filename
- Click any card to expand details below

**Detailed Candidate View:**

- Candidate name and match score
- AI-generated justification (why they match/don't match)
- **Extracted Skills:** Clickable skill badges
- **Experience Summary:** AI-summarized background
- Resume filename reference

**Navigation:**

- "Back to Upload" - Return to start new analysis
- "View History" - See all past sessions

---

### Page 3: History (MongoDB)

**Session List (Paginated):**

- Shows 5 sessions per page for fast loading
- Each session displays:
  - Job title (first line of JD)
  - Creation timestamp
  - Number of resumes analyzed
  - JD source (file or preset name)
- Click to load analysis on Analysis page
- Delete individual sessions (with confirmation)

**Pagination Controls:**

- Previous / Next buttons
- Page number buttons (1, 2, 3, ...)
- Page indicator: "Page 2 of 5 (23 total)"
- Instant page switching

**Data Source:**

- Loaded from MongoDB Atlas
- Accessible from any device
- Auto-refreshes after new analysis
- Optimized queries with server-side pagination

---

## Privacy & Security

- **Client-side file parsing** - Resume files never leave your browser during parsing
- **Secure API keys** - Stored as environment variables on Vercel, never exposed to client
- **MongoDB Atlas Security** - Industry-standard cloud database with encryption at rest and in transit
- **No authentication required** - Simple, friction-free user experience
- **CORS enabled** - Secure cross-origin resource sharing configuration
- **Open source** - Full code transparency on GitHub

### Data Storage

- **What's stored:** Job descriptions, resume text, AI analysis results
- **Where:** MongoDB Atlas (cloud) with automatic backups
- **Retention:** Data persists until manually deleted by user
- **Access:** Only you can see your screening sessions (no multi-user auth yet)

---

## Usage Guide

### **Quick Start**

1. **Navigate to Upload Page** (default landing page)
2. **Enter Job Description:**
   - Type/paste job description, OR
   - Click "Upload File" to select JD document, OR
   - Click "Select Preset" and choose from templates
3. **Upload Resumes:**
   - Drag-and-drop resume files into the right panel, OR
   - Click "Upload Resumes" to select files
4. **Click "Analyze Resumes & Continue"**
5. **View Results** on Analysis page
6. **Check History** to see all past sessions

### Best Practices

- **Job Descriptions:** Be specific with requirements, skills, and experience levels
- **Resume Uploads:** Maximum 10-15 resumes per session for optimal performance
- **File Formats:** PDF and DOCX work best, TXT is fastest
- **Save Sessions:** All analyses auto-save to MongoDB
- **Use History:** Quickly compare candidates across sessions

---

## Troubleshooting

### "504 Gateway Timeout" Error

**Cause:** Too many or too large resumes causing Gemini API timeout

**Solutions:**

- Reduce number of resumes (try 5-10 at a time)
- Use smaller file sizes
- Split large batches into multiple sessions

### "API_KEY is not set" Error

**Cause:** Missing environment variable in Vercel

**Solution:**

1. Go to Vercel project settings
2. Add `API_KEY` environment variable
3. Redeploy the application

### MongoDB Connection Failed

**Cause:** Invalid connection string or network access issue

**Solutions:**

- Check `MONGODB_URI` format (URL-encode special characters)
- Verify MongoDB Atlas Network Access whitelist (`0.0.0.0/0`)
- Confirm database user has read/write permissions

### "Failed to parse file" Error

**Cause:** Corrupted file or unsupported format

**Solutions:**

- Ensure file is valid PDF, DOCX, or TXT
- Try re-saving the file
- Check file isn't password-protected
- Try a different file format

### History Not Loading

**Cause:** MongoDB connection issue or empty database

**Solutions:**

- Check browser console for errors
- Verify `MONGODB_URI` environment variable
- Create a new analysis session to populate database
- Check MongoDB Atlas cluster is running (not paused)

---

## Performance Tips

1. **Pagination:** History loads only 5 sessions per page - navigate through pages for more
2. **Batch Processing:** Analyze 5-10 resumes at once for fastest results
3. **File Optimization:** Compress large PDFs before uploading
4. **Browser Cache:** Clear cache if experiencing slow loads
5. **Network:** Use stable internet connection for AI analysis

---

## Author

**Naushaba Imroz**

- GitHub: [@nimroz13](https://github.com/nimroz13)
- Project: [Smart Resume Screener](https://nimroz13-smart-resume-screener.vercel.app/)

---

## Acknowledgments

- **Google Gemini AI** - Powerful AI model for intelligent resume analysis
- **MongoDB Atlas** - Reliable cloud database with free tier
- **Vercel** - Seamless serverless deployment platform
- **React Team** - Excellent framework for building modern UIs
- **Open Source Community** - Amazing tools and libraries (pdf.js, mammoth.js, etc.)

---


If you find this project helpful, please consider giving it a star on GitHub!

**Built using React, TypeScript, MongoDB, and Gemini AI**
