'use client';

import { useEffect } from 'react';
import { useValidationStore } from '@/state/validationStore';

export function ValidationFeedback() {
  const lastErrors = useValidationStore((state) => state.lastErrors);
  const lastWarnings = useValidationStore((state) => state.lastWarnings);
  const clearResult = useValidationStore((state) => state.clearResult);

  // Auto-dismiss warnings after 4 seconds
  useEffect(() => {
    if (lastWarnings.length > 0 && lastErrors.length === 0) {
      const timer = setTimeout(() => {
        clearResult();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [lastWarnings, lastErrors, clearResult]);

  // If both empty, render nothing
  if (lastErrors.length === 0 && lastWarnings.length === 0) {
    return null;
  }

  // Show error banner (red, persistent)
  if (lastErrors.length > 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-900/50 border-b border-red-800 text-sm">
        {/* Error icon */}
        <svg
          className="flex-shrink-0 text-red-400"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 4 L8 9 M8 11 L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Error message */}
        <span className="flex-1 text-red-200">{lastErrors[0].message}</span>

        {/* Dismiss button */}
        <button
          onClick={clearResult}
          className="flex-shrink-0 text-red-400 hover:text-red-300"
          title="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4 L12 12 M4 12 L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  // Show warning banner (amber, auto-dismiss)
  if (lastWarnings.length > 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/50 border-b border-amber-800 text-sm">
        {/* Warning icon */}
        <svg
          className="flex-shrink-0 text-amber-400"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 2 L14 14 L2 14 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 6 L8 10 M8 11.5 L8 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Warning message */}
        <span className="flex-1 text-amber-200">{lastWarnings[0].message}</span>

        {/* Dismiss button */}
        <button
          onClick={clearResult}
          className="flex-shrink-0 text-amber-400 hover:text-amber-300"
          title="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4 L12 12 M4 12 L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  return null;
}
