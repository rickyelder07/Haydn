'use client';

import { useRef, useEffect } from 'react';
import type { HaydnNote } from '@/lib/midi/types';
import { ticksToX } from './gridUtils';
import { useEditStore } from '@/state/editStore';
import { useProjectStore } from '@/state/projectStore';

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

  // Drag state stored in a ref to avoid re-renders during drag
  const dragRef = useRef<{
    noteIndex: number;
    isMultiSelect: boolean;
    velocitySnapshot: number[]; // velocities of all notes at drag start
    startY: number;
  } | null>(null);

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

  // Hit-test helper: find note index closest to x within 8px hit radius
  function hitTest(x: number): number | null {
    const pixelsPerTick = 0.1 * zoomX;
    for (let i = 0; i < notes.length; i++) {
      const stalkX = ticksToX(notes[i].ticks, pixelsPerTick, scrollX);
      if (Math.abs(x - stalkX) < 8) return i;
    }
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const noteIndex = hitTest(x);
    if (noteIndex === null || trackIndex === null) return;

    const noteId = `${trackIndex}-${noteIndex}`;
    const isMultiSelect = selectedNoteIds.size > 1 && selectedNoteIds.has(noteId);

    // Snapshot all note velocities at drag start
    const velocitySnapshot = notes.map(n => n.velocity);

    dragRef.current = { noteIndex, isMultiSelect, velocitySnapshot, startY: e.clientY };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { noteIndex, isMultiSelect, velocitySnapshot, startY } = dragRef.current;
      const deltaY = startY - e.clientY; // drag up = higher velocity
      const deltaVelocity = deltaY / height;

      const updateNoteDirectly = useEditStore.getState().updateNoteDirectly;

      if (isMultiSelect) {
        selectedNoteIds.forEach(id => {
          const parts = id.split('-');
          if (parts.length === 2) {
            const idx = parseInt(parts[1]);
            if (idx >= 0 && idx < notes.length) {
              const newVel = Math.max(0, Math.min(1, velocitySnapshot[idx] + deltaVelocity));
              updateNoteDirectly(idx, { velocity: newVel });
            }
          }
        });
      } else {
        const newVel = Math.max(0, Math.min(1, velocitySnapshot[noteIndex] + deltaVelocity));
        updateNoteDirectly(noteIndex, { velocity: newVel });
      }
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { noteIndex, isMultiSelect } = dragRef.current;

      // Push final state to history via updateNote (one undo entry)
      const updateNote = useEditStore.getState().updateNote;
      const project = useProjectStore.getState().project;
      const finalNotes = project?.tracks[trackIndex]?.notes;

      if (finalNotes && isMultiSelect) {
        selectedNoteIds.forEach(id => {
          const parts = id.split('-');
          if (parts.length === 2) {
            const idx = parseInt(parts[1]);
            if (idx >= 0 && idx < finalNotes.length) {
              updateNote(idx, { velocity: finalNotes[idx].velocity });
            }
          }
        });
      } else if (finalNotes) {
        updateNote(noteIndex, { velocity: finalNotes[noteIndex].velocity });
      }

      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: width + 'px', height: height + 'px', display: 'block', cursor: 'ns-resize' }}
      onMouseDown={handleMouseDown}
    />
  );
}
