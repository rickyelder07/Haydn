'use client';

import { DetectedChord } from './chordDetection';
import { PIANO_KEY_WIDTH, ticksToX } from './gridUtils';

export interface ChordStripProps {
  chords: DetectedChord[];
  scrollX: number;
  zoomX: number;
  ppq: number;
  width: number;
  onChordClick: (chord: DetectedChord) => void;
}

export function ChordStrip({ chords, scrollX, zoomX, width, onChordClick }: ChordStripProps) {
  return (
    <div
      className="relative overflow-hidden bg-[#0D1117] border-b border-white/8"
      style={{ height: '24px', width: `${width + PIANO_KEY_WIDTH}px` }}
    >
      {chords.map((chord, i) => {
        const pixelsPerTick = 0.1 * zoomX;
        const x = PIANO_KEY_WIDTH + ticksToX(chord.barStartTicks, pixelsPerTick, scrollX);
        const barWidth = (chord.barEndTicks - chord.barStartTicks) * pixelsPerTick;

        // Skip if outside visible area
        if (x + barWidth < 0 || x > width + PIANO_KEY_WIDTH) return null;

        return (
          <button
            key={i}
            onClick={() => onChordClick(chord)}
            className="absolute top-0 h-full flex items-center px-1.5 text-[10px] font-mono text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors truncate"
            style={{
              left: `${x}px`,
              maxWidth: `${Math.max(20, barWidth - 2)}px`,
            }}
            title={`${chord.symbol} — click to select notes`}
          >
            {chord.symbol}
          </button>
        );
      })}
    </div>
  );
}

export default ChordStrip;
