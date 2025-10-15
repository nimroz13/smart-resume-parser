import React, { useState } from 'react';
import type { Candidate, Resume } from '../types';

interface ResumeScoreTableProps {
    candidates: Candidate[];
    resumes?: Resume[];
    onViewDetails: (candidateId: string) => void;
}

const ResumeScoreTable: React.FC<ResumeScoreTableProps> = ({ candidates, resumes, onViewDetails }) => {

    // Helper function to get resume filename
    const getResumeFileName = (candidateId: string): string => {
        const resume = resumes?.find(r => r.id === candidateId);
        return resume?.fileName || 'Unknown File';
    };
    const [rejectionThreshold, setRejectionThreshold] = useState<number>(5);
    const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

    // Separate candidates into accepted and rejected
    const acceptedCandidates = candidates.filter(c =>
        c.matchScore >= rejectionThreshold && !rejectedIds.has(c.id)
    );

    const rejectedCandidates = candidates.filter(c =>
        c.matchScore < rejectionThreshold || rejectedIds.has(c.id)
    );

    const toggleRejection = (candidateId: string) => {
        setRejectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(candidateId)) {
                newSet.delete(candidateId);
            } else {
                newSet.add(candidateId);
            }
            return newSet;
        });
    };

    const getScoreColor = (score: number): string => {
        if (score >= 8) return 'text-green-700 bg-green-100';
        if (score >= 6) return 'text-yellow-700 bg-yellow-100';
        if (score >= 4) return 'text-orange-700 bg-orange-100';
        return 'text-red-700 bg-red-100';
    };

    const getScoreBadgeColor = (score: number): string => {
        if (score >= 8) return 'bg-green-500';
        if (score >= 6) return 'bg-yellow-500';
        if (score >= 4) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Header with Threshold Selector */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-xl font-display font-bold text-gray-900">Resume Score Overview</h3>
                        <p className="text-sm text-gray-600 mt-1">Quick comparison of all candidates</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Rejection Threshold:</label>
                        <select
                            value={rejectionThreshold}
                            onChange={(e) => setRejectionThreshold(Number(e.target.value))}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value={4}>Below 4</option>
                            <option value={5}>Below 5</option>
                            <option value={6}>Below 6</option>
                            <option value={7}>Below 7</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {/* Accepted Candidates Column */}
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <h4 className="font-bold text-gray-900">Qualified Candidates ({acceptedCandidates.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {acceptedCandidates.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No qualified candidates</p>
                        ) : (
                            acceptedCandidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="group bg-gradient-to-r from-white to-green-50 border border-green-200 rounded-xl p-3 hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-bold text-gray-900 truncate">{candidate.name}</h5>
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${getScoreColor(candidate.matchScore)}`}>
                                                    {candidate.matchScore}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-xs text-gray-600 truncate" title={getResumeFileName(candidate.id)}>{getResumeFileName(candidate.id)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getScoreBadgeColor(candidate.matchScore)}`}
                                                        style={{ width: `${(candidate.matchScore / 10) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => onViewDetails(candidate.id)}
                                                className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => toggleRejection(candidate.id)}
                                                className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"
                                                title="Reject candidate"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-1">{candidate.justification}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Rejected Candidates Column */}
                <div className="p-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <h4 className="font-bold text-gray-900">Rejected Candidates ({rejectedCandidates.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {rejectedCandidates.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No rejected candidates</p>
                        ) : (
                            rejectedCandidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="group bg-white border border-red-200 rounded-xl p-3 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-bold text-gray-700 truncate">{candidate.name}</h5>
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${getScoreColor(candidate.matchScore)}`}>
                                                    {candidate.matchScore}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-xs text-gray-600 truncate" title={getResumeFileName(candidate.id)}>
                                                    {getResumeFileName(candidate.id)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${getScoreBadgeColor(candidate.matchScore)}`}
                                                        style={{ width: `${(candidate.matchScore / 10) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => onViewDetails(candidate.id)}
                                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => toggleRejection(candidate.id)}
                                                className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition-colors"
                                                title="Accept candidate"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-1">{candidate.justification}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-gray-900">{candidates.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Qualified:</span>
                            <span className="font-bold text-green-700">{acceptedCandidates.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Rejected:</span>
                            <span className="font-bold text-red-700">{rejectedCandidates.length}</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        Threshold: Scores below {rejectionThreshold} are auto-rejected
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeScoreTable;
