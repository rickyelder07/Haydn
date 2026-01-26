'use client';

import { usePlaybackStore } from '@/state/playbackStore';
import { TimeDisplay } from './TimeDisplay';
import { TempoSlider } from './TempoSlider';

// SVG icons as inline components for simplicity
const PlayIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const SkipBackIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

interface TransportControlsProps {
  className?: string;
  disabled?: boolean;
}

export function TransportControls({ className = '', disabled = false }: TransportControlsProps) {
  const {
    playbackState,
    isLoading,
    progress,
    togglePlayPause,
    stop,
    seekToProgress,
  } = usePlaybackStore();

  const isPlaying = playbackState === 'playing';
  const canInteract = !disabled && !isLoading;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    seekToProgress(newProgress);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Top row: Controls and Time */}
      <div className="flex items-center justify-between mb-3">
        {/* Transport buttons */}
        <div className="flex items-center gap-2">
          {/* Skip to start */}
          <button
            onClick={stop}
            disabled={!canInteract}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            title="Stop and return to start (Enter)"
            aria-label="Stop"
          >
            <SkipBackIcon />
          </button>

          {/* Play/Pause toggle */}
          <button
            onClick={togglePlayPause}
            disabled={!canInteract}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>

          {/* Stop */}
          <button
            onClick={stop}
            disabled={!canInteract}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            title="Stop (Enter)"
            aria-label="Stop"
          >
            <StopIcon />
          </button>
        </div>

        {/* Time display */}
        <TimeDisplay />

        {/* Tempo slider */}
        <TempoSlider />
      </div>

      {/* Progress bar (click to seek) */}
      <div
        className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
        onClick={handleProgressClick}
        title="Click to seek"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
