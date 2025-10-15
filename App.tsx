import React, { useState } from 'react';
import { analyzeResumes } from './services/geminiService';
import { parseFile } from './services/fileParsers';
import type { Candidate, Resume, HistoryEntry } from './types';
import { useHistory } from './hooks/useHistory';
import { useMongoHistory } from './hooks/useMongoHistory';

import Header from './components/Header';
import JobDescriptionInput from './components/JobDescriptionInput';
import ResumeInput from './components/ResumeInput';
import CandidateCard from './components/CandidateCard';
import LoadingSpinner from './components/LoadingSpinner';
import Placeholder from './components/Placeholder';
import ErrorDisplay from './components/ErrorDisplay';
import ResumeScoreTable from './components/ResumeScoreTable';
import HistorySidebar from './components/HistorySidebar';
import MongoHistorySidebar from './components/MongoHistorySidebar';
import { saveSearchSessionToMongo } from './services/mongoClient';

type PageView = 'upload' | 'analysis' | 'history';
const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [pageView, setPageView] = useState<PageView>('upload');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Candidate[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isParsingJD, setIsParsingJD] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [jdPresetName, setJdPresetName] = useState<string | null>(null);

  // Separate state for current analysis session (won't be cleared until new analysis)
  const [currentAnalysisJD, setCurrentAnalysisJD] = useState<string>('');
  const [currentAnalysisResumes, setCurrentAnalysisResumes] = useState<Resume[]>([]);
  const [currentAnalysisJDFileName, setCurrentAnalysisJDFileName] = useState<string | null>(null);
  const [currentAnalysisJDPresetName, setCurrentAnalysisJDPresetName] = useState<string | null>(null);

  // Use MongoDB history instead of localStorage
  const {
    history: mongoHistory,
    isLoading: historyLoading,
    error: historyError,
    pagination,
    removeHistoryEntry: removeMongoHistoryEntry,
    clearHistory: clearMongoHistory,
    nextPage,
    prevPage,
    goToPage,
    refresh: refreshHistory,
  } = useMongoHistory();

  // Keep localStorage as backup
  const { history, addHistoryEntry, removeHistoryEntry, clearHistory } = useHistory();

  const handleAddResume = (text: string) => {
    if (text.trim()) {
      const newResume: Resume = {
        id: `resume_${Date.now()}_${resumes.length + 1}`,
        text,
        fileName: `Pasted Resume ${resumes.length + 1}`,
      };
      setResumes(prev => [...prev, newResume]);
      setAnalysisResults(null); // Clear results when resumes change
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsParsing(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const parsedResumesPromises = Array.from(files).map(async (file) => {
        const text = await parseFile(file);
        return {
          id: `resume_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          text,
          fileName: file.name,
        };
      });

      const newResumes = await Promise.all(parsedResumesPromises);
      setResumes(prev => [...prev, ...newResumes.filter(r => r.text.trim())]);
    } catch (err: any) {
      setError(err.message || 'An error occurred while parsing the files.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveResume = (id: string) => {
    setResumes(prev => prev.filter(r => r.id !== id));
    setAnalysisResults(null); // Clear results when resumes change
  };

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    setJdFileName(null); // Clear file name if manually editing
    setJdPresetName(null); // Clear preset name if manually editing
    setAnalysisResults(null); // Clear results when JD changes
  };

  const handleJDFileChange = async (file: File | null) => {
    if (!file) {
      setJdFileName(null);
      return;
    }

    setIsParsingJD(true);
    setError(null);
    setAnalysisResults(null);
    setJdPresetName(null); // Clear preset name when uploading file

    try {
      const text = await parseFile(file);
      setJobDescription(text);
      setJdFileName(file.name);
    } catch (err: any) {
      setError(err.message || 'An error occurred while parsing the job description file.');
      setJdFileName(null);
    } finally {
      setIsParsingJD(false);
    }
  };

  const handlePresetSelect = (description: string, presetName: string) => {
    setJobDescription(description);
    setJdPresetName(presetName);
    setJdFileName(null); // Clear file name when using preset
    setAnalysisResults(null); // Clear results when JD changes
  };

  const handleScreenResumes = async () => {
    if (!jobDescription.trim() || resumes.length === 0) {
      setError('Please provide a job description and at least one resume.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setAnalysisResults(null);

    try {
      const results = await analyzeResumes(jobDescription, resumes);
      results.sort((a, b) => b.matchScore - a.matchScore);
      setAnalysisResults(results);

      // Store current analysis data before clearing inputs
      setCurrentAnalysisJD(jobDescription);
      setCurrentAnalysisResumes(resumes);
      setCurrentAnalysisJDFileName(jdFileName);
      setCurrentAnalysisJDPresetName(jdPresetName);

      // Save to history on success (localStorage)
      addHistoryEntry({ jobDescription, jdFileName, jdPresetName, resumes, analysisResults: results });

      // Save to MongoDB (in background, don't block UI)
      try {
        await saveSearchSessionToMongo({
          jobDescription,
          jdFileName,
          jdPresetName,
          resumes,
          analysisResults: results,
        });
        console.log('Session saved to MongoDB successfully');
        // Refresh MongoDB history to show the new session
        refreshHistory();
      } catch (mongoError) {
        console.error('Failed to save to MongoDB, but localStorage saved:', mongoError);
        // Don't show error to user - localStorage backup is sufficient
      }

      // Reset job description and resumes after successful analysis
      setJobDescription('');
      setResumes([]);
      setJdFileName(null);
      setJdPresetName(null);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while analyzing the resumes. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadHistoryEntry = (entry: HistoryEntry) => {
    setAnalysisResults(entry.analysisResults);

    // Set current analysis data for display
    setCurrentAnalysisJD(entry.jobDescription);
    setCurrentAnalysisResumes(entry.resumes);
    setCurrentAnalysisJDFileName(entry.jdFileName || null);
    setCurrentAnalysisJDPresetName(entry.jdPresetName || null);

    setError(null);
    setIsLoading(false);
    setPageView('analysis'); // Switch to analysis view when loading from history
  };

  const canScreen = jobDescription.trim().length > 0 && resumes.length > 0 && !isLoading && !isParsing && !isParsingJD;

  return (
    <div className="min-h-screen text-slate-900 font-sans bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header pageView={pageView} setPageView={setPageView} />
      <div className="container mx-auto p-4 md:p-8 relative">

        {/* Page 1: Upload - Job Description and Resume Upload */}
        {pageView === 'upload' && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                Step 1: Upload Job Description & Resumes
              </h2>
              <p className="text-gray-600">Provide the job details and upload candidate resumes to begin screening</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <JobDescriptionInput
                value={jobDescription}
                onChange={handleJobDescriptionChange}
                onFileChange={handleJDFileChange}
                onPresetSelect={handlePresetSelect}
                isParsing={isParsingJD}
                uploadedFileName={jdFileName}
              />
              <ResumeInput
                resumes={resumes}
                onAddResume={handleAddResume}
                onRemoveResume={handleRemoveResume}
                onFileChange={handleFileChange}
                isParsing={isParsing}
              />
            </div>
            <button
              onClick={async () => {
                await handleScreenResumes();
                if (!error) {
                  setPageView('analysis');
                }
              }}
              disabled={!canScreen}
              className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Analyzing Resumes...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Analyze Resumes & Continue</span>
                </>
              )}
            </button>
            {error && <ErrorDisplay message={error} />}
          </div>
        )}

        {/* Page 2: Analysis - Results and Detailed View */}
        {pageView === 'analysis' && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                  Step 2: Analysis Results
                </h2>
                <p className="text-gray-600">Review candidate matches and detailed analysis</p>
              </div>
              <button
                onClick={() => setPageView('upload')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Upload
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl py-20">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-lg font-semibold text-primary-600">Analyzing candidates...</p>
                </div>
              </div>
            )}

            {!isLoading && !error && analysisResults && (
              <div className="space-y-6">
                {/* Resume Score Table */}
                <ResumeScoreTable
                  candidates={analysisResults}
                  resumes={currentAnalysisResumes}
                  onViewDetails={(candidateId) => {
                    setSelectedCandidateId(candidateId);
                    // Scroll to the candidate card
                    setTimeout(() => {
                      const element = document.getElementById(`candidate-${candidateId}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                  }}
                />

                {/* Job Description Display */}
                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-6 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-display font-bold text-gray-900">Job Description</h3>
                    {(currentAnalysisJDFileName || currentAnalysisJDPresetName) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        {currentAnalysisJDFileName ? (
                          <>
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Uploaded: {currentAnalysisJDFileName}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span className="font-medium">Template: {currentAnalysisJDPresetName}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {currentAnalysisJD}
                    </p>
                  </div>
                </div>

                {/* Detailed Candidate Cards */}
                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-4">Detailed Analysis</h3>
                  <div className="space-y-4 overflow-y-auto max-h-[70vh] p-1 pr-2">
                    {analysisResults.map((candidate) => {
                      const originalResume = currentAnalysisResumes.find(r => r.id === candidate.id);
                      if (!originalResume) return null;
                      return (
                        <div
                          key={candidate.id}
                          id={`candidate-${candidate.id}`}
                          className={selectedCandidateId === candidate.id ? 'ring-2 ring-primary-500 rounded-xl' : ''}
                        >
                          <CandidateCard
                            candidate={candidate}
                            resumeText={originalResume.text}
                            jobDescription={currentAnalysisJD}
                            resumeFileName={originalResume.fileName}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !analysisResults && (
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-12 rounded-2xl shadow-xl text-center">
                <p className="text-gray-500 text-lg mb-4">No analysis results available</p>
                <button
                  onClick={() => setPageView('upload')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                >
                  Go to Upload Page
                </button>
              </div>
            )}

            {error && <ErrorDisplay message={error} />}
          </div>
        )}

        {/* Page 3: History */}
        {pageView === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                Step 3: History
              </h2>
              <p className="text-gray-600">Access your previous screening sessions from MongoDB</p>
            </div>
            <MongoHistorySidebar
              history={mongoHistory}
              isLoading={historyLoading}
              error={historyError}
              pagination={pagination}
              onLoadEntry={handleLoadHistoryEntry}
              onDeleteEntry={removeMongoHistoryEntry}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              onGoToPage={goToPage}
              currentJobDescription={jobDescription}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;