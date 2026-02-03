'use client';

import { useState } from 'react';
import { useNLEditStore } from '@/state/nlEditStore';

// Info icon SVG
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">
      i
    </text>
  </svg>
);

// Loading spinner SVG
const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Dismiss X icon
const XIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export function CommandInput() {
  const [localPrompt, setLocalPrompt] = useState('');

  const {
    isLoading,
    lastPrompt,
    lastResult,
    lastError,
    tokenUsage,
    submitPrompt,
    clearError
  } = useNLEditStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPrompt.trim() || isLoading) return;

    await submitPrompt(localPrompt.trim());
    // Clear input on success (when no error)
    if (!lastError) {
      setLocalPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Example prompts for info tooltip
  const examplePrompts = [
    'make the melody happier',
    'speed up to 140 BPM',
    'transpose up an octave',
    'add strings to track 2',
    'make the rhythm more syncopated',
  ];

  const buttonText = isLoading ? 'Processing...' : lastError ? 'Retry' : 'Edit';

  return (
    <div className="max-w-4xl mx-auto px-4 py-3">
      <form onSubmit={handleSubmit}>
        {/* Input row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Info icon with tooltip */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={`Example prompts:\n${examplePrompts.join('\n')}`}
            aria-label="Show example prompts"
          >
            <InfoIcon />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your edit... (e.g., 'make the melody happier')"
            disabled={isLoading}
            maxLength={500}
            className="flex-1 px-4 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !localPrompt.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 min-w-[120px] justify-center"
          >
            {isLoading && <SpinnerIcon />}
            {buttonText}
          </button>
        </div>

        {/* Inline feedback */}
        {lastError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <div className="flex-1">
              <strong className="font-medium">Error:</strong> {lastError}
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label="Dismiss error"
            >
              <XIcon />
            </button>
          </div>
        )}

        {!lastError && lastResult && tokenUsage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <div className="font-medium mb-1">{lastResult.summary}</div>
            <div className="text-green-600 text-xs">
              {tokenUsage.totalTokens} tokens (~${tokenUsage.estimatedCost.toFixed(4)})
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
