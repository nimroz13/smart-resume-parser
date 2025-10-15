import React from 'react';

const Placeholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 blur-2xl rounded-full opacity-40"></div>
        <svg xmlns="http://www.w3.org/2000/svg" className="relative h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-display font-bold text-gray-700 mb-2">Ready to Analyze</h3>
      <p className="max-w-sm text-sm text-gray-600 leading-relaxed">
        Upload resumes and enter a job description, then click <span className="text-primary-600 font-semibold">"Analyze Resumes"</span> to see matching results
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        <span>Powered by AI</span>
      </div>
    </div>
  );
};

export default Placeholder;