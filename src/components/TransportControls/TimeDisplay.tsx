'use client';

import { usePlaybackStore } from '@/state/playbackStore';

interface TimeDisplayProps {
  className?: string;
}

export function TimeDisplay({ className = '' }: TimeDisplayProps) {
  const {
    formattedPosition,
    formattedDuration,
    barsBeatsPosition,
  } = usePlaybackStore();

  return (
    <div className={`flex items-center gap-4 font-mono text-sm ${className}`}>
      {/* Clock time (mm:ss / mm:ss) */}
      <div className="flex items-center gap-1">
        <span className="text-gray-900 font-medium">{formattedPosition}</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500">{formattedDuration}</span>
      </div>

      {/* Musical time (bars.beats.sixteenths) */}
      <div className="text-gray-600 border-l border-gray-300 pl-4">
        <span className="text-xs text-gray-400 mr-1">Bar</span>
        <span className="font-medium">{barsBeatsPosition}</span>
      </div>
    </div>
  );
}
