import React from 'react';
import type { HistoryEntry } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import TrashIcon from './icons/TrashIcon';
import ClockIcon from './icons/ClockIcon';

interface MongoHistorySidebarProps {
    history: HistoryEntry[];
    isLoading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    onLoadEntry: (entry: HistoryEntry) => void;
    onDeleteEntry: (id: string) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
    onGoToPage: (page: number) => void;
    currentJobDescription: string;
}

const MongoHistorySidebar: React.FC<MongoHistorySidebarProps> = ({
    history,
    isLoading,
    error,
    pagination,
    onLoadEntry,
    onDeleteEntry,
    onNextPage,
    onPrevPage,
    onGoToPage,
    currentJobDescription,
}) => {
    return (
        <aside className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-5 flex flex-col h-full max-h-[calc(100vh-120px)] shadow-lg">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="w-6 h-6 text-secondary-600" />
                    <h2 className="text-lg font-display font-bold text-gray-900">History</h2>
                </div>
                <div className="text-xs text-gray-500">
                    {pagination.totalCount} session{pagination.totalCount !== 1 ? 's' : ''}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    <p className="font-semibold">Error loading history</p>
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                {isLoading ? (
                    <div className="text-center text-gray-400 pt-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
                        <p className="text-sm">Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center text-gray-400 pt-12">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No history yet</p>
                        <p className="text-xs mt-1 text-gray-500">Past analyses will appear here</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {history.map(entry => {
                            const isActive = entry.jobDescription === currentJobDescription &&
                                entry.analysisResults?.length > 0;
                            return (
                                <li key={entry.id} className="group">
                                    <div
                                        onClick={() => onLoadEntry(entry)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
                                                ? 'bg-gradient-to-r from-blue-100 to-purple-100 border border-primary-400 shadow-md'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-xs truncate ${isActive ? 'text-primary-700' : 'text-gray-700'}`} title={entry.title}>
                                                    {entry.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                        {entry.analysisResults?.length || 0} resumes
                                                    </span>
                                                    {entry.jdFileName && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span className="text-blue-600 truncate" title={entry.jdFileName}>
                                                                {entry.jdFileName}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {entry.jdPresetName && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                                            </svg>
                                                            <span className="text-purple-600 truncate" title={entry.jdPresetName}>
                                                                {entry.jdPresetName}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Delete this session?')) {
                                                        onDeleteEntry(entry.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all flex-shrink-0"
                                                aria-label="Delete this entry"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-2">
                                            <ClockIcon className="w-3 h-3" />
                                            <span>{new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && pagination.totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={onPrevPage}
                            disabled={!pagination.hasPrevPage}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Prev
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => onGoToPage(pageNum)}
                                    className={`w-7 h-7 text-xs font-semibold rounded-lg transition-all ${pageNum === pagination.page
                                            ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onNextPage}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-500 mt-2">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                    </p>
                </div>
            )}
        </aside>
    );
};

export default MongoHistorySidebar;
