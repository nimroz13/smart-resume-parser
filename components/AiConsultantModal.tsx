import React, { useState, useRef, useEffect } from 'react';
import type { ConsultantMessage } from '../types';
import LoadingSpinner from './LoadingSpinner';
import SendIcon from './icons/SendIcon';
import LightbulbIcon from './icons/LightbulbIcon';

interface AiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ConsultantMessage[];
  onAsk: (question: string) => void;
  isLoading: boolean;
  error: string | null;
}

const AiConsultantModal: React.FC<AiConsultantModalProps> = ({ isOpen, onClose, messages, onAsk, isLoading, error }) => {
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onAsk(question);
      setQuestion('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white backdrop-blur-lg border border-gray-200 rounded-lg shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <LightbulbIcon className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Recruitment Consultant</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">&times;</button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 p-8">
                <p>Welcome! I'm your AI Recruitment Consultant.</p>
                <p className="text-sm mt-2">Ask me anything about your job description or how to screen candidates!</p>
                <p className="text-sm mt-1">e.g., "How can I improve my job description?"</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-prose p-3 rounded-lg ${msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-prose p-3 rounded-lg bg-white border border-gray-200">
                  <LoadingSpinner />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </main>

        <footer className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask for advice..."
              className="w-full p-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-300"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="bg-primary-600 text-white p-2 rounded-lg shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default AiConsultantModal;