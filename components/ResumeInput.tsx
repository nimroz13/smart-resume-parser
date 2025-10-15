import React, { useState } from 'react';
import type { Resume } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ResumeInputProps {
  resumes: Resume[];
  onAddResume: (text: string) => void;
  onRemoveResume: (id: string) => void;
  onFileChange: (files: FileList | null) => void;
  isParsing: boolean;
}

const ResumeInput: React.FC<ResumeInputProps> = ({ resumes, onAddResume, onRemoveResume, onFileChange, isParsing }) => {
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleAddClick = () => {
    onAddResume(pastedText);
    setPastedText('');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isParsing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isParsing && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-6 rounded-2xl shadow-lg">
      <h2 className="flex items-center gap-2 text-xl font-display font-bold mb-2 text-gray-900">
        <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Candidate Resumes
      </h2>
      <p className="text-sm text-gray-600 mb-5">Drag & drop files here, upload, or paste resume content below</p>

      <div className="mb-5">
        <div
          className={`relative block w-full font-semibold py-8 px-5 rounded-xl text-center transition-all duration-300 border-2 border-dashed ${isParsing
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              : isDragging
                ? 'bg-gradient-to-r from-primary-100 to-accent-100 border-primary-600 text-primary-800 scale-105 shadow-lg'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-primary-400 hover:border-primary-500 text-primary-700 cursor-pointer hover:from-blue-100 hover:to-cyan-100'
            }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isParsing ? (
            <span className="flex flex-col items-center justify-center gap-3">
              <LoadingSpinner />
              <span>Processing Files...</span>
            </span>
          ) : isDragging ? (
            <span className="flex flex-col items-center justify-center gap-3">
              <svg className="w-12 h-12 text-primary-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg font-bold">Drop files here!</span>
            </span>
          ) : (
            <>
              <label className="cursor-pointer">
                <span className="flex flex-col items-center justify-center gap-3">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-base">
                    <span className="font-bold">Click to upload</span> or drag and drop
                  </span>
                  <span className="text-sm text-gray-500 font-normal">
                    PDF, TXT, or DOCX files
                  </span>
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.docx"
                  multiple
                  onChange={(e) => onFileChange(e.target.files)}
                  disabled={isParsing}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="relative">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Or paste resume text directly here..."
            className="w-full h-28 p-4 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-300 placeholder:text-gray-400 resize-none"
            disabled={isParsing}
          />
        </div>
        <button
          onClick={handleAddClick}
          disabled={!pastedText.trim()}
          className="mt-3 w-full bg-gradient-to-r from-accent-600 to-accent-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-accent-500 hover:to-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Resume
        </button>
      </div>

      {resumes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 mb-2">UPLOADED RESUMES ({resumes.length})</p>
          {resumes.map((resume, index) => (
            <div key={resume.id} className="flex items-center justify-between bg-gradient-to-r from-white to-blue-50 hover:to-blue-100 p-3 rounded-lg border border-gray-200 transition-all duration-200 group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-sm font-medium truncate text-gray-700 group-hover:text-gray-900" title={resume.fileName}>
                  {resume.fileName}
                </span>
              </div>
              <button
                onClick={() => onRemoveResume(resume.id)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                aria-label="Remove resume"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeInput;