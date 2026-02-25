'use client';

import { useState } from 'react';
import { useNLGenerationStore } from '@/state/nlGenerationStore';

const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const examplePrompts = [
  'chill lofi hip hop beat in C minor',
  'upbeat jazz tune in Bb major',
  'dark trap beat at 150 BPM',
  'classical piano piece in C major',
  'boom bap instrumental in Am',
];

export function GenerationInput() {
  const [localPrompt, setLocalPrompt] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const { isLoading, lastError, tokenUsage, submitGeneration, clearError } = useNLGenerationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPrompt.trim() || isLoading) return;
    await submitGeneration(localPrompt.trim());
    if (!lastError) setLocalPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        {/* Input row */}
        <div className="flex items-center gap-3">
          {/* Info icon — outside input, left side */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-white/20 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label="Show example prompts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-[#1A2030] border border-white/10 rounded-xl shadow-xl z-50">
                <p className="text-xs font-medium text-gray-300 mb-2">Example prompts:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  {examplePrompts.map((p, i) => (
                    <li key={i} className="cursor-pointer hover:text-gray-200 transition-colors" onClick={() => setLocalPrompt(p)}>
                      • {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Text input */}
          <input
            type="text"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to create... (e.g., 'lofi beat in C minor')"
            disabled={isLoading}
            maxLength={500}
            className="flex-1 px-4 py-3 bg-[#131824] border border-white/10 rounded-xl text-sm text-primary placeholder:text-gray-500 focus:outline-none focus:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />

          {/* Generate button */}
          <button
            type="submit"
            disabled={isLoading || !localPrompt.trim()}
            className="px-5 py-3 bg-gradient-to-r from-purple-500/40 to-pink-500/40 hover:from-purple-500/60 hover:to-pink-500/60 border border-purple-500/30 text-white rounded-xl font-medium text-sm flex items-center gap-2 min-w-[110px] justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <SpinnerIcon /> : null}
            {isLoading ? 'Generating...' : lastError ? 'Retry' : 'Generate'}
          </button>
        </div>

        {/* Error state */}
        {lastError && (
          <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <div className="flex-1"><strong className="font-medium">Error:</strong> {lastError}</div>
            <button type="button" onClick={clearError} className="text-red-400/60 hover:text-red-400 transition-colors mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        )}

        {/* Success state */}
        {!lastError && tokenUsage && (
          <div className="mt-3 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-sm">
            <div className="font-medium">Project generated successfully!</div>
            <div className="text-cyan-400/60 text-xs mt-0.5">{tokenUsage.totalTokens} tokens (~${tokenUsage.estimatedCost.toFixed(4)})</div>
          </div>
        )}
      </form>
    </div>
  );
}
