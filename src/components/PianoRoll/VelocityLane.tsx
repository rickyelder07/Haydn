'use client';

import { useRef, useEffect } from 'react';
import type { HaydnNote } from '@/lib/midi/types';
import { ticksToX } from './gridUtils';

export interface VelocityLaneProps {
  notes: HaydnNote[];
  ppq: number;
  scrollX: number;
  zoomX: number;
  selectedNoteIds: Set<string>;
  trackIndex: number | null;
  width: number;
  height: number;
}

export function VelocityLane({
  notes,
  ppq,
  scrollX,
  zoomX,
  selectedNoteIds,
  trackIndex,
  width,
  height,
}: VelocityLaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render stalks on canvas whenever display state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle top border line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.stroke();

    const pixelsPerTick = 0.1 * zoomX;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const stalkX = ticksToX(note.ticks, pixelsPerTick, scrollX);

      // Cull off-screen stalks
      if (stalkX < -10 || stalkX > width + 10) continue;

      const noteId = `${trackIndex}-${i}`;
      const isSelected = selectedNoteIds.has(noteId);

      const stalkWidth = 4;
      const stalkHeight = Math.max(2, note.velocity * (height - 6));
      const stalkY = height - stalkHeight;

      // Color: selected = bright cyan, unselected = velocity-proportional dim-to-bright cyan
      if (isSelected) {
        ctx.fillStyle = 'hsl(186, 100%, 70%)';
      } else {
        const lightness = 20 + note.velocity * 60;
        ctx.fillStyle = `hsl(186, 100%, ${lightness}%)`;
      }

      // Draw stalk body
      ctx.fillRect(stalkX - stalkWidth / 2, stalkY, stalkWidth, stalkHeight);

      // Draw tip cap for easier grab target
      ctx.beginPath();
      ctx.arc(stalkX, stalkY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [notes, scrollX, zoomX, selectedNoteIds, width, height, trackIndex]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: width + 'px', height: height + 'px', display: 'block' }}
    />
  );
}
