import React from 'react';
import LightbulbIcon from './icons/LightbulbIcon';

interface AiConsultantButtonProps {
  onClick: () => void;
}

const AiConsultantButton: React.FC<AiConsultantButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-gradient-to-br from-secondary-600 to-secondary-700 text-white w-16 h-16 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-secondary-500 transition-all duration-300 flex items-center justify-center z-50 group"
      aria-label="Ask AI Recruitment Consultant"
    >
      <div className="flex items-center justify-center flex-col gap-0.5">
        <LightbulbIcon className="w-7 h-7 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold tracking-wide">AI Help</span>
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-md"></div>
    </button>
  );
};

export default AiConsultantButton;