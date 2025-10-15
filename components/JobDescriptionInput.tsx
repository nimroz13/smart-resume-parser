import React, { useRef, useState } from 'react';
import PresetRolesSelector from './PresetRolesSelector';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  onPresetSelect?: (description: string, presetName: string) => void;
  isParsing?: boolean;
  uploadedFileName?: string | null;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  onFileChange,
  onPresetSelect,
  isParsing = false,
  uploadedFileName = null
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File | null) => {
    if (onFileChange) {
      onFileChange(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]); // Only allow one file
    }
  };

  const handleRemoveFile = () => {
    handleFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 p-6 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
        <label htmlFor="job-description" className="flex items-center gap-2 text-xl font-display font-bold text-gray-900">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Job Description
        </label>
        <PresetRolesSelector onSelect={(description, presetName) => {
          onChange(description);
          if (onPresetSelect && presetName) {
            onPresetSelect(description, presetName);
          }
        }} />
      </div>
      <p className="text-sm text-gray-600 mb-4">Type your job description, select a preset, or upload a file</p>

      {/* File Upload Area */}
      {onFileChange && (
        <div className="mb-4">
          {!uploadedFileName ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 bg-gray-50 hover:border-primary-400'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="jd-file-upload"
              />
              <label htmlFor="jd-file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-sm">
                    <span className="font-semibold text-primary-600">Click to upload</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX or TXT (one file only)</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{uploadedFileName}</span>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                title="Remove file"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {isParsing && (
            <div className="mt-2 flex items-center gap-2 text-sm text-primary-600">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Reading file...</span>
            </div>
          )}
        </div>
      )}

      <textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Senior React Developer with 5+ years of experience in TypeScript, Next.js, and modern frontend architectures..."
        className="w-full h-48 p-4 bg-gray-50 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 placeholder:text-gray-400"
        disabled={isParsing}
      />
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>Characters: {value.length}</span>
      </div>
    </div>
  );
};

export default JobDescriptionInput;