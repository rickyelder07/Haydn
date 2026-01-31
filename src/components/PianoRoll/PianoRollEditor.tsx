'use client';

import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { useValidationStore } from '@/state/validationStore';
import { PianoRollCanvas } from './PianoRollCanvas';
import { PianoKeysSidebar } from './PianoKeysSidebar';
import { usePianoRollInteractions } from './usePianoRollInteractions';
import { ZoomControls } from './ZoomControls';
import { NoteInspector } from './NoteInspector';
import { ValidationFeedback } from './ValidationFeedback';
import { TheoryControls } from './TheoryControls';
import { NOTE_HEIGHT, PIANO_KEY_WIDTH } from './gridUtils';

const EDITOR_HEIGHT = 700;

export function PianoRollEditor() {
  const project = useProjectStore((state) => state.project);
  const selectedTrackIndex = useEditStore((state) => state.selectedTrackIndex);
  const selectedNoteIds = useEditStore((state) => state.selectedNoteIds);
  const canUndo = useEditStore((state) => state.canUndo);
  const canRedo = useEditStore((state) => state.canRedo);
  const undo = useEditStore((state) => state.undo);
  const redo = useEditStore((state) => state.redo);
  const updateNote = useEditStore((state) => state.updateNote);
  const deleteNote = useEditStore((state) => state.deleteNote);
  const playheadTicks = usePlaybackStore((state) => state.position.ticks);
  const scalePitchClasses = useValidationStore((state) => state.scalePitchClasses);
  const validationEnabled = useValidationStore((state) => state.enabled);
  const updateScaleInfo = useValidationStore((state) => state.updateScaleInfo);

  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [zoomX, setZoomX] = useState(1.0);
  const [zoomY, setZoomY] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get selected track data
  const selectedTrack = project && selectedTrackIndex !== null
    ? project.tracks[selectedTrackIndex]
    : null;

  const notes = selectedTrack?.notes || [];
  const ppq = project?.metadata.ppq || 480;
  const timeSignature = project?.metadata.timeSignatures[0] || { numerator: 4, denominator: 4, ticks: 0 };
  const durationTicks = project?.durationTicks || ppq * 16; // Default 16 beats

  // Compute selected note for inspector
  // Note ID format: "${trackIndex}-${noteIndex}"
  const selectedNote =
    selectedNoteIds.size === 1 && selectedTrackIndex !== null
      ? (() => {
          const noteId = Array.from(selectedNoteIds)[0];
          const parts = noteId.split('-');
          if (parts.length === 2 && parseInt(parts[0]) === selectedTrackIndex) {
            const noteIndex = parseInt(parts[1]);
            return { note: notes[noteIndex] || null, index: noteIndex };
          }
          return { note: null, index: null };
        })()
      : { note: null, index: null };

  // Canvas dimensions
  const canvasWidth = 800; // Fixed width for now
  const canvasHeight = EDITOR_HEIGHT - 80; // Account for toolbar and scrollbar

  // Initialize scroll position to center on C4 (MIDI 60)
  useEffect(() => {
    const c4Y = (127 - 60) * NOTE_HEIGHT * zoomY; // Y position of C4
    const centerY = c4Y - canvasHeight / 2;
    setScrollY(Math.max(0, centerY));
  }, [canvasHeight, zoomY]);

  // Update scale info when track or project changes
  useEffect(() => {
    if (project) {
      updateScaleInfo(project.metadata.keySignatures, playheadTicks || 0);
    }
  }, [project, selectedTrackIndex, playheadTicks, updateScaleInfo]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      } else if (modifier && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Mouse interactions
  const { handleMouseDown, handleContextMenu, dragState } = usePianoRollInteractions({
    canvasRef,
    notes,
    ppq,
    zoomX,
    zoomY,
    scrollX,
    scrollY,
    trackIndex: selectedTrackIndex!,
  });

  // Native wheel event listener with passive:false to prevent page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pixelsPerTick = 0.1 * zoomX;
      const totalHeight = 128 * NOTE_HEIGHT * zoomY;
      const totalWidth = (durationTicks + ppq * 4) * pixelsPerTick;

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Wheel: horizontal zoom
        const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        const newZoomX = Math.max(0.25, Math.min(4.0, zoomX * delta));
        setZoomX(newZoomX);
      } else if (e.altKey) {
        // Alt+Wheel: vertical zoom
        const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        const newZoomY = Math.max(0.5, Math.min(3.0, zoomY * delta));
        setZoomY(newZoomY);
      } else if (e.shiftKey) {
        // Shift+Wheel: horizontal scroll (for mouse users)
        const newScrollX = scrollX + e.deltaY;
        setScrollX(Math.max(0, Math.min(newScrollX, totalWidth - canvasWidth)));
      } else {
        // Handle both vertical (deltaY) and horizontal (deltaX) scroll
        // This supports trackpad two-finger gestures in both directions

        // Vertical scroll
        if (e.deltaY !== 0) {
          const newScrollY = scrollY + e.deltaY;
          setScrollY(Math.max(0, Math.min(newScrollY, totalHeight - canvasHeight)));
        }

        // Horizontal scroll (trackpad horizontal swipe)
        if (e.deltaX !== 0) {
          const newScrollX = scrollX + e.deltaX;
          setScrollX(Math.max(0, Math.min(newScrollX, totalWidth - canvasWidth)));
        }
      }
    };

    // Use { passive: false } to allow preventDefault() to work
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoomX, zoomY, scrollX, scrollY, durationTicks, ppq, canvasWidth, canvasHeight]);

  if (!project || selectedTrackIndex === null) {
    return (
      <div className="w-full h-96 flex items-center justify-center border rounded-lg bg-gray-900 text-gray-400">
        <p>No track selected. Select a track from the track list to begin editing.</p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-gray-900" style={{ isolation: 'isolate' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        {/* Undo button */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded ${
            canUndo
              ? 'hover:bg-gray-700 text-gray-200'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Undo (Cmd+Z)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 5 L3 10 L8 15 M3 10 L17 10 C17 10 17 8 14 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        {/* Redo button */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded ${
            canRedo
              ? 'hover:bg-gray-700 text-gray-200'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Redo (Cmd+Shift+Z)"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12 5 L17 10 L12 15 M17 10 L3 10 C3 10 3 8 6 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        <div className="h-6 w-px bg-gray-700 mx-2"></div>

        {/* Zoom controls */}
        <ZoomControls
          zoomX={zoomX}
          zoomY={zoomY}
          onZoomXChange={setZoomX}
          onZoomYChange={setZoomY}
        />

        <div className="h-6 w-px bg-gray-700 mx-2"></div>

        {/* Theory controls */}
        <TheoryControls />

        <div className="h-6 w-px bg-gray-700 mx-2"></div>

        {/* Mode indicator */}
        <div className="text-sm text-gray-400">
          Click to add | Right-click to delete | Drag to move
        </div>

        <div className="flex-1"></div>

        {/* Track name */}
        <div className="text-sm text-gray-300">
          {selectedTrack?.name}
        </div>
      </div>

      {/* Validation feedback */}
      <ValidationFeedback />

      {/* Main editor area */}
      <div
        ref={containerRef}
        className="relative flex"
        style={{
          height: `${EDITOR_HEIGHT - 40}px`,
          overflow: 'hidden', // Prevent scrolling from bubbling to page
          touchAction: 'none', // Prevent touch gestures from affecting page scroll
        }}
      >
        {/* Piano keys sidebar */}
        <div className="flex-shrink-0">
          <PianoKeysSidebar scrollY={scrollY} height={canvasHeight} zoomY={zoomY} />
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-hidden relative">
          <PianoRollCanvas
            notes={notes}
            ppq={ppq}
            timeSignature={timeSignature}
            durationTicks={durationTicks}
            scrollX={scrollX}
            scrollY={scrollY}
            zoomX={zoomX}
            zoomY={zoomY}
            selectedNoteIds={selectedNoteIds}
            playheadTicks={playheadTicks}
            trackIndex={selectedTrackIndex}
            width={canvasWidth}
            height={canvasHeight}
            scalePitchClasses={validationEnabled ? scalePitchClasses : null}
            onCanvasClick={(ticks, midi) => {
              // Handled by usePianoRollInteractions via handleMouseDown
            }}
            onNoteClick={(noteIndex, event) => {
              // Handled by usePianoRollInteractions via handleMouseDown
            }}
            onNoteDragStart={(noteIndex, event) => {
              // Handled by usePianoRollInteractions via handleMouseDown
            }}
          />
          {/* Attach mouse handlers to canvas */}
          <div
            className="absolute inset-0"
            style={{
              pointerEvents: 'all',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onContextMenu={handleContextMenu}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                cursor: dragState?.isDragging ? 'grabbing' : 'crosshair',
                opacity: 0, // Invisible interaction layer over PianoRollCanvas
                pointerEvents: 'all',
              }}
              width={canvasWidth}
              height={canvasHeight}
            />
          </div>
        </div>

        {/* Note Inspector sidebar */}
        <NoteInspector
          note={selectedNote.note}
          noteIndex={selectedNote.index}
          ppq={ppq}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      </div>
    </div>
  );
}
