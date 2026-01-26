'use client';

import { usePlaybackStore } from '@/state/playbackStore';
import { getMetronome } from '@/audio/playback/Metronome';

interface MetronomeToggleProps {
  className?: string;
}

export function MetronomeToggle({ className = '' }: MetronomeToggleProps) {
  const { metronomeEnabled, setMetronomeEnabled, playbackState } = usePlaybackStore();

  const handleToggle = () => {
    const newEnabled = !metronomeEnabled;
    setMetronomeEnabled(newEnabled);

    // If currently playing, immediately start/stop metronome
    if (playbackState === 'playing') {
      if (newEnabled) {
        getMetronome().start();
      } else {
        getMetronome().stop();
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
        metronomeEnabled
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
      title={metronomeEnabled ? 'Turn metronome off' : 'Turn metronome on'}
      aria-pressed={metronomeEnabled}
    >
      {/* Metronome icon */}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1.5L6 21h12L12 1.5zm0 6.5l2.5 9h-5l2.5-9z" />
      </svg>
      <span>Click</span>
    </button>
  );
}
