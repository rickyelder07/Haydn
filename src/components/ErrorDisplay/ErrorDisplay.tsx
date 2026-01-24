'use client';

import { useProjectStore } from '@/state/projectStore';

export function ErrorDisplay() {
  const { error, setError } = useProjectStore();

  if (!error) {
    return null;
  }

  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800">
            Error loading file
          </h3>
          <p className="text-sm text-red-600 mt-1">
            {error}
          </p>
        </div>
        <button
          onClick={() => setError(null)}
          className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
