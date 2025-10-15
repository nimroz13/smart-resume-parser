import React from 'react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const getScoreColor = (s: number): string => {
    if (s >= 8) return 'from-emerald-400 to-green-500 shadow-emerald-400/60 ring-emerald-400/30';
    if (s >= 5) return 'from-amber-400 to-orange-500 shadow-amber-400/60 ring-amber-400/30';
    return 'from-rose-400 to-red-500 shadow-rose-400/60 ring-rose-400/30';
  };

  const scoreColorClasses = getScoreColor(score);

  return (
    <div className={`relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-display font-extrabold shadow-lg bg-gradient-to-br text-white ${scoreColorClasses} ring-2 ring-offset-2 ring-offset-white`}>
      <span className="text-3xl">{score}</span>
      <span className="text-[10px] font-medium tracking-wider opacity-90">/ 10</span>
    </div>
  );
};

export default ScoreDisplay;