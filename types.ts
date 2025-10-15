export interface Resume {
  id: string;
  text: string;
  fileName: string;
}

export interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  justification: string;
  extractedSkills: string[];
  extractedExperienceSummary: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  jobDescription: string;
  jdFileName?: string | null;
  jdPresetName?: string | null;
  resumes: Resume[];
  analysisResults: Candidate[];
  title: string;
}

export interface ConsultantMessage {
  role: "user" | "assistant";
  content: string;
}

// Types for the new Resume Builder feature
export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export interface ResumeBuilderData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string;
}
