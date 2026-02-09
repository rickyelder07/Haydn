'use client';

import { useTrackUIStore } from '@/state/trackUIStore';

interface TrackControlsProps {
  trackIndex: number;
}

export function TrackControls({ trackIndex }: TrackControlsProps) {
  const { mutedTracks, soloedTracks, hiddenTracks, toggleMute, toggleSolo, toggleHidden } = useTrackUIStore();
  const isMuted = mutedTracks.has(trackIndex);
  const isSoloed = soloedTracks.has(trackIndex);
  const isHidden = hiddenTracks.has(trackIndex);

  return (
    <div className="flex items-center gap-1.5">
      {/* Mute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute(trackIndex);
        }}
        className={`h-7 w-7 flex items-center justify-center rounded transition-all ${
          isMuted
            ? 'bg-gray-400 text-white opacity-50'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={isMuted ? 'Unmute track' : 'Mute track'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isMuted ? (
            // Speaker with slash icon
            <>
              <path
                d="M8 3L5 6H2v4h3l3 3V3z"
                fill="currentColor"
              />
              <path
                d="M14 8l-2-2m0 4l2-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          ) : (
            // Speaker icon
            <>
              <path
                d="M8 3L5 6H2v4h3l3 3V3z"
                fill="currentColor"
              />
              <path
                d="M11 6.5c.5.5 1 1.5 1 1.5s-.5 1-1 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </button>

      {/* Solo button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleSolo(trackIndex);
        }}
        className={`h-7 w-7 flex items-center justify-center rounded transition-all ${
          isSoloed
            ? 'bg-amber-400 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={isSoloed ? 'Unsolo track' : 'Solo track'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Headphones icon */}
          <path
            d="M3 10v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"
            fill="currentColor"
          />
          <path
            d="M11 10v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1z"
            fill="currentColor"
          />
          <path
            d="M3 10a5 5 0 0 1 10 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      {/* Hide from ghost view button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleHidden(trackIndex);
        }}
        className={`h-7 w-7 flex items-center justify-center rounded transition-all ${
          isHidden
            ? 'bg-gray-400 text-white opacity-50'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={isHidden ? 'Show in ghost view' : 'Hide from ghost view'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isHidden ? (
            // Eye slash icon (hidden)
            <>
              <path
                d="M3 3l18 18M10.5 10.677a2 2 0 002.823 2.823"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6 1.55 0 3.043-.523 4.395-1.35M17 14.25c.97-1.016 1.737-2.189 2.426-3.256.06-.093.093-.136.11-.207a.643.643 0 000-.274c-.017-.07-.05-.114-.11-.207C17.6 7.404 14.5 4 12 4c-.446 0-.887.052-1.32.145"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          ) : (
            // Eye icon (visible)
            <>
              <path
                d="M12 5C8.24 5 5.29 7.61 3.42 10.42a2 2 0 000 2.16C5.29 15.39 8.24 18 12 18s6.71-2.61 8.58-5.42a2 2 0 000-2.16C18.71 7.61 15.76 5 12 5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
