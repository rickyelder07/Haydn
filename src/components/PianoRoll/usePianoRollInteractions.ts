'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { HaydnNote } from '@/lib/midi/types';
import { useEditStore } from '@/state/editStore';
import {
  NOTE_HEIGHT,
  ticksToX,
  xToTicks,
  midiToY,
  yToMidi,
  getSnapTicks,
  snapToGrid,
} from './gridUtils';

interface DragState {
  isDragging: boolean;
  noteIndex: number | null;
  startMidi: number;
  startTicks: number;
  startMouseX: number;
  startMouseY: number;
}

interface UsePianoRollInteractionsParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  notes: HaydnNote[];
  ppq: number;
  zoomX: number;
  zoomY: number;
  scrollX: number;
  scrollY: number;
}

export function usePianoRollInteractions({
  canvasRef,
  notes,
  ppq,
  zoomX,
  zoomY,
  scrollX,
  scrollY,
}: UsePianoRollInteractionsParams) {
  const editStore = useEditStore();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const mouseMoveListenerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpListenerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const pixelsPerTick = 0.1 * zoomX;

  /**
   * Hit-test to find note under click point
   * Returns note index or null if no hit
   */
  const hitTestNote = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Iterate notes in reverse order (top notes drawn last = highest z-index)
      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        const noteX = ticksToX(note.ticks, pixelsPerTick, scrollX);
        const noteEndX = ticksToX(note.ticks + note.durationTicks, pixelsPerTick, scrollX);
        const noteY = midiToY(note.midi, scrollY);

        // Apply minimum width for hit-testing
        let noteWidth = noteEndX - noteX;
        if (noteWidth < 3) {
          noteWidth = 3;
        }

        // Check if click is within note bounds
        if (
          x >= noteX &&
          x <= noteX + noteWidth &&
          y >= noteY &&
          y <= noteY + NOTE_HEIGHT
        ) {
          return i;
        }
      }

      return null;
    },
    [canvasRef, notes, pixelsPerTick, scrollX, scrollY]
  );

  /**
   * Handle mousedown - add note, select note, or start drag
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to MIDI coordinates
      const clickTicks = xToTicks(x, pixelsPerTick, scrollX);
      const clickMidi = yToMidi(y, scrollY);

      // Hit-test for existing notes
      const hitNoteIndex = hitTestNote(e.clientX, e.clientY);

      if (hitNoteIndex !== null) {
        const hitNote = notes[hitNoteIndex];

        // Right-click or Shift+Left-click -> Delete note
        if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
          e.preventDefault();
          editStore.deleteNote(hitNoteIndex);
          return;
        }

        // Left-click -> Select and start drag
        if (e.button === 0) {
          // Select note (future: multi-select with shift)
          const noteId = `${hitNoteIndex}`;
          editStore.selectNote(noteId);

          // Start drag state
          setDragState({
            isDragging: true,
            noteIndex: hitNoteIndex,
            startMidi: hitNote.midi,
            startTicks: hitNote.ticks,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
          });

          editStore.setEditing(true);
          return;
        }
      } else {
        // No note hit - left-click on empty space -> Add note
        if (e.button === 0) {
          const snapTicks = getSnapTicks(ppq, pixelsPerTick);
          const snappedTicks = snapToGrid(clickTicks, snapTicks);

          // Create new note with default duration (one beat)
          const newNote: HaydnNote = {
            midi: clickMidi,
            ticks: snappedTicks,
            durationTicks: ppq,
            velocity: 0.8,
          };

          editStore.addNote(newNote);
          editStore.clearSelection();
        }
      }
    },
    [canvasRef, pixelsPerTick, scrollX, scrollY, ppq, notes, hitTestNote, editStore]
  );

  /**
   * Handle context menu - prevent default to allow right-click delete
   */
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  /**
   * Global mousemove handler for drag operations
   */
  useEffect(() => {
    if (!dragState || !dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || dragState.noteIndex === null) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Calculate delta in pixels
      const deltaX = e.clientX - dragState.startMouseX;
      const deltaY = e.clientY - dragState.startMouseY;

      // Convert delta to ticks and MIDI
      const deltaTicks = deltaX / pixelsPerTick;
      const deltaMidi = -Math.round(deltaY / NOTE_HEIGHT); // Negative because Y increases downward

      // Calculate new position (not yet snapped)
      const newTicks = dragState.startTicks + deltaTicks;
      const newMidi = dragState.startMidi + deltaMidi;

      // Clamp MIDI to valid range
      const clampedMidi = Math.max(0, Math.min(127, newMidi));

      // Update drag state to reflect current position (visual feedback)
      // Note: We don't update the actual note position until mouseup
      setDragState({
        ...dragState,
        // We could add previewTicks/previewMidi here for live preview
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragState || dragState.noteIndex === null) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Calculate final delta
      const deltaX = e.clientX - dragState.startMouseX;
      const deltaY = e.clientY - dragState.startMouseY;

      const deltaTicks = deltaX / pixelsPerTick;
      const deltaMidi = -Math.round(deltaY / NOTE_HEIGHT);

      // Calculate final position
      const newTicks = dragState.startTicks + deltaTicks;
      const newMidi = Math.max(0, Math.min(127, dragState.startMidi + deltaMidi));

      // Snap to grid
      const snapTicks = getSnapTicks(ppq, pixelsPerTick);
      const snappedTicks = snapToGrid(newTicks, snapTicks);

      // Apply move to store
      editStore.moveNote(dragState.noteIndex, newMidi, snappedTicks);
      editStore.setEditing(false);

      // Clear drag state
      setDragState(null);
    };

    // Attach global listeners
    mouseMoveListenerRef.current = handleMouseMove;
    mouseUpListenerRef.current = handleMouseUp;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (mouseMoveListenerRef.current) {
        window.removeEventListener('mousemove', mouseMoveListenerRef.current);
      }
      if (mouseUpListenerRef.current) {
        window.removeEventListener('mouseup', mouseUpListenerRef.current);
      }
    };
  }, [dragState, canvasRef, pixelsPerTick, ppq, editStore]);

  return {
    handleMouseDown,
    handleContextMenu,
    dragState,
  };
}
