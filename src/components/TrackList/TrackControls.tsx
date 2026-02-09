'use client';

import { useTrackUIStore } from '@/state/trackUIStore';

interface TrackControlsProps {
  trackIndex: number;
}

export function TrackControls({ trackIndex }: TrackControlsProps) {
  const { mutedTracks, soloedTracks, toggleMute, toggleSolo } = useTrackUIStore();
  const isMuted = mutedTracks.has(trackIndex);
  const isSoloed = soloedTracks.has(trackIndex);

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
    </div>
  );
}
