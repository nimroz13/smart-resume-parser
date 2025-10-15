import React, { useState } from 'react';
import type { Candidate } from '../types';
import ScoreDisplay from './ScoreDisplay';
import { askQuestionAboutResume } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import SparklesIcon from './icons/SparklesIcon';

interface CandidateCardProps {
  candidate: Candidate;
  resumeText: string;
  jobDescription: string;
  resumeFileName?: string;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, resumeText, jobDescription, resumeFileName }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    setAnswer(null);
    setAskError(null);

    try {
      const result = await askQuestionAboutResume(resumeText, question, jobDescription);
      setAnswer(result);
    } catch (err: any) {
      setAskError(err.message || 'An error occurred.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-display font-bold text-gray-900">{candidate.name}</h3>
          {resumeFileName && (
            <div className="flex items-center gap-2 mt-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-600" title={resumeFileName}>{resumeFileName}</p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Candidate Profile</p>
        </div>
        <ScoreDisplay score={candidate.matchScore} />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Justification
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed pl-6">{candidate.justification}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Experience Summary
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed pl-6">{candidate.extractedExperienceSummary}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Relevant Skills
          </h4>
          <div className="flex flex-wrap gap-2 pl-6">
            {candidate.extractedSkills.map((skill, index) => (
              <span key={index} className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Q&A Section */}
      <div className="mt-6 pt-5 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-accent-600" />
          Ask AI Assistant
        </h4>
        <div className="flex flex-col gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`e.g., "How does this candidate compare for leadership roles?"`}
            className="w-full h-20 p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-sm placeholder:text-gray-400"
            disabled={isAsking}
          />
          <button
            onClick={handleAskQuestion}
            disabled={!question.trim() || isAsking}
            className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-secondary-500 hover:to-secondary-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isAsking ? (
              <>
                <LoadingSpinner />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>Ask Question</span>
              </>
            )}
          </button>
        </div>

        {askError && (
          <p className="mt-3 text-sm text-red-400 bg-red-900/40 p-2 rounded-md">{askError}</p>
        )}

        {answer && (
          <div className="mt-3 p-3 bg-slate-800/70 rounded-lg">
            <h5 className="font-bold text-sm text-cyan-400">Answer:</h5>
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;