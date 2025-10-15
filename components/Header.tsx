import React from 'react';

interface HeaderProps {
  pageView: 'upload' | 'analysis' | 'history';
  setPageView: (view: 'upload' | 'analysis' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({ pageView, setPageView }) => {
  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-20 shadow-lg">
      <div className="container mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-600 bg-clip-text text-transparent animate-fade-in">
              Smart Resume Screener
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">
              AI-Powered Talent Matching System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${pageView === 'upload' ? 'bg-primary-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}
                onClick={() => setPageView('upload')}
              >
                <span className="hidden sm:inline">1. Upload</span>
                <span className="sm:hidden">Upload</span>
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${pageView === 'analysis' ? 'bg-primary-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}
                onClick={() => setPageView('analysis')}
              >
                <span className="hidden sm:inline">2. Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${pageView === 'history' ? 'bg-primary-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}
                onClick={() => setPageView('history')}
              >
                <span className="hidden sm:inline">3. History</span>
                <span className="sm:hidden">History</span>
              </button>
            </nav>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">AI Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;