'use client';

import { usePlaybackStore } from '@/state/playbackStore';

interface TempoSliderProps {
  className?: string;
}

export function TempoSlider({ className = '' }: TempoSliderProps) {
  const { tempo, setTempo } = usePlaybackStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempo(Number(e.target.value));
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="text-sm text-gray-600 whitespace-nowrap">
        BPM
      </label>
      <input
        type="range"
        min={40}
        max={240}
        value={tempo}
        onChange={handleChange}
        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <span className="text-sm font-mono font-medium text-gray-900 w-10 text-right">
        {Math.round(tempo)}
      </span>
    </div>
  );
}
