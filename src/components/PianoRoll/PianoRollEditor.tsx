'use client';

import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { PianoRollCanvas } from './PianoRollCanvas';
import { PianoKeysSidebar } from './PianoKeysSidebar';
import { usePianoRollInteractions } from './usePianoRollInteractions';
import { NOTE_HEIGHT, PIANO_KEY_WIDTH } from './gridUtils';

const EDITOR_HEIGHT = 400;

export function PianoRollEditor() {
  const project = useProjectStore((state) => state.project);
  const selectedTrackIndex = useEditStore((state) => state.selectedTrackIndex);
  const canUndo = useEditStore((state) => state.canUndo);
  const canRedo = useEditStore((state) => state.canRedo);
  const undo = useEditStore((state) => state.undo);
  const redo = useEditStore((state) => state.redo);
  const playheadTicks = usePlaybackStore((state) => state.position.ticks);

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

  // Canvas dimensions
  const canvasWidth = 800; // Fixed width for now
  const canvasHeight = EDITOR_HEIGHT - 80; // Account for toolbar and scrollbar

  // Initialize scroll position to center on C4 (MIDI 60)
  useEffect(() => {
    const c4Y = (127 - 60) * NOTE_HEIGHT; // Y position of C4
    const centerY = c4Y - canvasHeight / 2;
    setScrollY(Math.max(0, centerY));
  }, [canvasHeight]);

  // Mouse interactions
  const { handleMouseDown, handleContextMenu, dragState } = usePianoRollInteractions({
    canvasRef,
    notes,
    ppq,
    zoomX,
    zoomY,
    scrollX,
    scrollY,
  });

  // Wheel handler for scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const pixelsPerTick = 0.1 * zoomX;
    const totalHeight = 128 * NOTE_HEIGHT;
    const totalWidth = (durationTicks + ppq * 4) * pixelsPerTick; // Add 4 beats padding

    if (e.shiftKey) {
      // Horizontal scroll
      const newScrollX = scrollX + e.deltaY;
      setScrollX(Math.max(0, Math.min(newScrollX, totalWidth - canvasWidth)));
    } else {
      // Vertical scroll
      const newScrollY = scrollY + e.deltaY;
      setScrollY(Math.max(0, Math.min(newScrollY, totalHeight - canvasHeight)));
    }
  };

  if (!project || selectedTrackIndex === null) {
    return (
      <div className="w-full h-96 flex items-center justify-center border rounded-lg bg-gray-900 text-gray-400">
        <p>No track selected. Select a track from the track list to begin editing.</p>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-gray-900">
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

      {/* Main editor area */}
      <div
        ref={containerRef}
        className="relative flex"
        style={{ height: `${EDITOR_HEIGHT - 40}px` }}
        onWheel={handleWheel}
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
            playheadTicks={playheadTicks}
            trackIndex={selectedTrackIndex}
            width={canvasWidth}
            height={canvasHeight}
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
              left: `${PIANO_KEY_WIDTH}px`,
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
      </div>
    </div>
  );
}
