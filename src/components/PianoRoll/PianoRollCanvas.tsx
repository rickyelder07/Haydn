'use client';

import { useEffect, useRef } from 'react';
import { HaydnNote } from '@/lib/midi/types';
import {
  NOTE_HEIGHT,
  ticksToX,
  xToTicks,
  midiToY,
  yToMidi,
  getGridLines,
  getSnapTicks,
  snapToGrid,
} from './gridUtils';

interface PianoRollCanvasProps {
  notes: HaydnNote[];
  ppq: number;
  timeSignature: { numerator: number; denominator: number };
  durationTicks: number;
  scrollX: number;
  scrollY: number;
  zoomX?: number;
  zoomY?: number;
  selectedNoteIds?: Set<string>;
  playheadTicks?: number;
  onCanvasClick?: (ticks: number, midi: number) => void;
  onNoteClick?: (noteIndex: number, event: React.MouseEvent) => void;
  onNoteDragStart?: (noteIndex: number, event: React.MouseEvent) => void;
  trackIndex: number;
  width: number;
  height: number;
}

export function PianoRollCanvas({
  notes,
  ppq,
  timeSignature,
  durationTicks,
  scrollX,
  scrollY,
  zoomX = 1.0,
  zoomY = 1.0,
  selectedNoteIds,
  playheadTicks,
  onCanvasClick,
  onNoteClick,
  onNoteDragStart,
  trackIndex,
  width,
  height,
}: PianoRollCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle mouse events
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const pixelsPerTick = 0.1 * zoomX;

    // Calculate MIDI coordinates
    const clickTicks = xToTicks(x, pixelsPerTick, scrollX);
    const clickMidi = yToMidi(y, scrollY);

    // Hit-test notes (check in reverse order so top notes are hit first)
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      const noteX = ticksToX(note.ticks, pixelsPerTick, scrollX);
      const noteEndX = ticksToX(note.ticks + note.durationTicks, pixelsPerTick, scrollX);
      const noteY = midiToY(note.midi, scrollY);

      // Check if click is within note bounds
      if (
        x >= noteX &&
        x <= noteEndX &&
        y >= noteY &&
        y <= noteY + NOTE_HEIGHT
      ) {
        // Hit a note
        if (onNoteClick) {
          onNoteClick(i, event);
        }
        if (onNoteDragStart && event.button === 0) {
          onNoteDragStart(i, event);
        }
        return;
      }
    }

    // No note hit - empty canvas click
    if (onCanvasClick) {
      // Snap to grid
      const snapTicks = getSnapTicks(ppq, pixelsPerTick);
      const snappedTicks = snapToGrid(clickTicks, snapTicks);
      onCanvasClick(snappedTicks, clickMidi);
    }
  };

  // Render function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any pending animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule render on next animation frame
    animationFrameRef.current = requestAnimationFrame(() => {
      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      const pixelsPerTick = 0.1 * zoomX;

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Get grid lines
      const gridLines = getGridLines(
        width,
        height,
        pixelsPerTick,
        scrollX,
        scrollY,
        ppq,
        timeSignature
      );

      // Draw horizontal grid lines (one per semitone)
      gridLines.horizontal.forEach((line) => {
        if (line.type === 'beat') {
          // C notes - highlighted
          ctx.strokeStyle = '#444444';
          ctx.lineWidth = 1;
        } else {
          // Other notes
          ctx.strokeStyle = '#2a2a2a';
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(0, line.position);
        ctx.lineTo(width, line.position);
        ctx.stroke();

        // Draw label for C notes
        if (line.label) {
          ctx.fillStyle = '#666666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(line.label, 5, line.position + NOTE_HEIGHT / 2);
        }
      });

      // Draw vertical grid lines
      gridLines.vertical.forEach((line) => {
        if (line.type === 'bar') {
          // Bar lines - bold
          ctx.strokeStyle = '#555555';
          ctx.lineWidth = 2;
        } else if (line.type === 'beat') {
          // Beat lines - medium
          ctx.strokeStyle = '#3a3a3a';
          ctx.lineWidth = 1;
        } else {
          // Subdivision lines - light
          ctx.strokeStyle = '#2a2a2a';
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.moveTo(line.position, 0);
        ctx.lineTo(line.position, height);
        ctx.stroke();

        // Draw bar number labels
        if (line.label) {
          ctx.fillStyle = '#666666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(line.label, line.position, 5);
        }
      });

      // Draw notes
      notes.forEach((note, index) => {
        const noteId = `${trackIndex}-${index}`;
        const isSelected = selectedNoteIds?.has(noteId);

        const x = ticksToX(note.ticks, pixelsPerTick, scrollX);
        const endX = ticksToX(note.ticks + note.durationTicks, pixelsPerTick, scrollX);
        const y = midiToY(note.midi, scrollY);

        // Calculate width with minimum visual size
        let noteWidth = endX - x;
        if (noteWidth < 3) {
          noteWidth = 3;
        }

        // Skip notes completely outside viewport
        if (x + noteWidth < 0 || x > width) return;
        if (y + NOTE_HEIGHT < 0 || y > height) return;

        // Color based on velocity and selection
        const hue = isSelected ? 40 : 210; // Gold for selected, blue for normal
        const baseLightness = 40 + note.velocity * 20; // Brighter = louder (40-60%)
        const lightness = isSelected ? Math.min(baseLightness + 15, 75) : baseLightness; // Selected notes are brighter
        const saturation = isSelected ? 85 : 70; // Selected notes more saturated

        const radius = 3;

        // Helper function to draw rounded rectangle path
        const drawRoundedRectPath = (px: number, py: number, width: number, height: number) => {
          ctx.beginPath();
          ctx.moveTo(px + radius, py);
          ctx.lineTo(px + width - radius, py);
          ctx.quadraticCurveTo(px + width, py, px + width, py + radius);
          ctx.lineTo(px + width, py + height - radius);
          ctx.quadraticCurveTo(px + width, py + height, px + width - radius, py + height);
          ctx.lineTo(px + radius, py + height);
          ctx.quadraticCurveTo(px, py + height, px, py + height - radius);
          ctx.lineTo(px, py + radius);
          ctx.quadraticCurveTo(px, py, px + radius, py);
          ctx.closePath();
        };

        // Draw glow background for selected notes
        if (isSelected) {
          // Draw glow layer with shadow
          ctx.save();
          ctx.shadowColor = 'rgba(255, 200, 0, 0.8)'; // Bright yellow-gold glow
          ctx.shadowBlur = 20;
          ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
          drawRoundedRectPath(x, y, noteWidth, NOTE_HEIGHT);
          ctx.fill();
          ctx.restore();
        }

        // Draw main note (no shadow)
        ctx.shadowBlur = 0;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        drawRoundedRectPath(x, y, noteWidth, NOTE_HEIGHT);
        ctx.fill();

        // Draw border for selected notes
        if (isSelected) {
          ctx.strokeStyle = `hsl(${hue}, 100%, ${lightness + 20}%)`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });

      // Draw playhead
      if (playheadTicks !== undefined) {
        const playheadX = ticksToX(playheadTicks, pixelsPerTick, scrollX);

        if (playheadX >= 0 && playheadX <= width) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, height);
          ctx.stroke();
        }
      }
    });

    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    notes,
    ppq,
    timeSignature,
    durationTicks,
    scrollX,
    scrollY,
    zoomX,
    zoomY,
    selectedNoteIds,
    playheadTicks,
    trackIndex,
    width,
    height,
  ]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      style={{
        display: 'block',
        cursor: 'crosshair',
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}
