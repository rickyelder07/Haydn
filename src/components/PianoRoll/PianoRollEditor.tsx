'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { useValidationStore } from '@/state/validationStore';
import { useTrackUIStore } from '@/state/trackUIStore';
import { PianoRollCanvas } from './PianoRollCanvas';
import { PianoKeysSidebar } from './PianoKeysSidebar';
import { usePianoRollInteractions } from './usePianoRollInteractions';
import { ZoomControls } from './ZoomControls';
import { NoteInspector } from './NoteInspector';
import { ValidationFeedback } from './ValidationFeedback';
import { TheoryControls } from './TheoryControls';
import { NOTE_HEIGHT, PIANO_KEY_WIDTH } from './gridUtils';
import { TimelineRuler } from '@/components/TimelineRuler';
import { InlineEdit } from '@/components/InlineEdit';
import { VelocityLane } from './VelocityLane';
import { QuantizePopover } from './QuantizePopover';
import { ChordStrip } from './ChordStrip';
import { detectChordsPerBar } from './chordDetection';
import type { DetectedChord } from './chordDetection';
import { quantizeNote } from './quantizeUtils';
import type { QuantizeParams } from './quantizeUtils';
import { HotkeyReference } from './HotkeyReference';

const EDITOR_HEIGHT = 700;

// Fixed zone heights
const TOOLBAR_HEIGHT = 40;    // toolbar div (py-2 rows)
const TIMELINE_HEIGHT = 36;   // TimelineRuler fixed height
const STATUS_BAR_HEIGHT = 40; // bottom status bar

export function PianoRollEditor() {
  const project = useProjectStore((state) => state.project);
  const updateTrackName = useProjectStore((state) => state.updateTrackName);
  const selectedTrackIndex = useEditStore((state) => state.selectedTrackIndex);
  const selectedNoteIds = useEditStore((state) => state.selectedNoteIds);
  const canUndo = useEditStore((state) => state.canUndo);
  const canRedo = useEditStore((state) => state.canRedo);
  const undo = useEditStore((state) => state.undo);
  const redo = useEditStore((state) => state.redo);
  const updateNote = useEditStore((state) => state.updateNote);
  const deleteNote = useEditStore((state) => state.deleteNote);
  const applyBatchEdit = useEditStore((state) => state.applyBatchEdit);
  const selectAll = useEditStore((state) => state.selectAll);
  const playheadTicks = usePlaybackStore((state) => state.position.ticks);
  const playbackState = usePlaybackStore((state) => state.playbackState);
  const tempo = usePlaybackStore((state) => state.tempo);
  const seekTo = usePlaybackStore((state) => state.seekTo);
  const scalePitchClasses = useValidationStore((state) => state.scalePitchClasses);
  const validationEnabled = useValidationStore((state) => state.enabled);
  const updateScaleInfo = useValidationStore((state) => state.updateScaleInfo);
  const { ghostNotesVisible, setGhostNotesVisible, isTrackVisibleInGhost } = useTrackUIStore();

  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [zoomX, setZoomX] = useState(1.0);
  const [zoomY, setZoomY] = useState(1.0);
  const [editorWidth, setEditorWidth] = useState(800);

  // Feature toggle state
  const [velocityLaneVisible, setVelocityLaneVisible] = useState(true);  // ON by default
  const [chordStripVisible, setChordStripVisible] = useState(false);      // OFF by default
  const [velocityLaneHeight, setVelocityLaneHeight] = useState(80);
  const VELOCITY_LANE_MIN = 48;
  const VELOCITY_LANE_MAX = 160;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  // Get selected track data
  const selectedTrack = project && selectedTrackIndex !== null
    ? project.tracks[selectedTrackIndex]
    : null;

  const notes = selectedTrack?.notes || [];
  const ppq = project?.metadata.ppq || 480;
  const timeSignature = project?.metadata.timeSignatures[0] || { numerator: 4, denominator: 4, ticks: 0 };
  const durationTicks = project?.durationTicks || ppq * 16; // Default 16 beats

  // Metadata for the toolbar stats strip
  const firstTempo = project?.metadata.tempos[0];
  const firstTimeSig = project?.metadata.timeSignatures[0];
  const firstKeySig = project?.metadata.keySignatures[0];
  const durationSecs = project ? (project.durationTicks / ppq) * (60 / (firstTempo?.bpm || 120)) : 0;
  const durationLabel = `${Math.floor(durationSecs / 60)}:${String(Math.floor(durationSecs % 60)).padStart(2, '0')}`;

  // Convert tick position to seconds and seek
  // Context-aware: seekTo moves position whether playing or paused;
  // if playing, the PlaybackController resumes from the new position automatically.
  const handleSeek = (ticks: number) => {
    const seconds = (ticks / ppq) * (60 / tempo);
    seekTo(seconds);
  };

  // Build allTracks array for ghost note rendering (filter out hidden tracks)
  const allTracks = project?.tracks
    .map((track, idx) => ({
      notes: track.notes,
      trackIndex: idx,
    }))
    .filter(({ trackIndex }) => isTrackVisibleInGhost(trackIndex, selectedTrackIndex)) ?? [];

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

  // Track outer container width and derive canvas width
  const NOTE_INSPECTOR_WIDTH = 192; // w-48 = 12rem = 192px
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setEditorWidth(Math.max(200, width - PIANO_KEY_WIDTH - NOTE_INSPECTOR_WIDTH));
    });
    observer.observe(el);
    // Set immediately on mount
    setEditorWidth(Math.max(200, el.clientWidth - PIANO_KEY_WIDTH - NOTE_INSPECTOR_WIDTH));
    return () => observer.disconnect();
  }, []);

  // Canvas dimensions
  const canvasWidth = editorWidth;

  // Dynamic note grid height: total minus fixed zones minus optional features
  const noteGridHeight = EDITOR_HEIGHT
    - TOOLBAR_HEIGHT
    - TIMELINE_HEIGHT
    - (chordStripVisible ? 24 : 0)
    - (velocityLaneVisible ? velocityLaneHeight + 6 : 0)  // +6 for divider
    - STATUS_BAR_HEIGHT;

  // canvasHeight = noteGridHeight (keeps existing references valid)
  const canvasHeight = noteGridHeight;

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
      } else if (modifier && e.key === 'a') {
        e.preventDefault();
        const allIds = notes.map((_, i) => `${selectedTrackIndex}-${i}`);
        selectAll(allIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectAll, notes, selectedTrackIndex]);

  // Velocity lane divider drag handler
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = velocityLaneHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY; // drag up = taller lane
      setVelocityLaneHeight(
        Math.max(VELOCITY_LANE_MIN, Math.min(VELOCITY_LANE_MAX, startHeight + delta))
      );
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Quantization apply handler
  const applyQuantization = useCallback((params: QuantizeParams) => {
    if (!project || selectedTrackIndex === null) return;

    const currentNotes = project.tracks[selectedTrackIndex].notes;
    const noteIndices = selectedNoteIds.size > 0
      ? Array.from(selectedNoteIds).map(id => parseInt(id.split('-')[1])).filter(i => !isNaN(i))
      : currentNotes.map((_, i) => i);

    const updatedNotes = currentNotes.map((note, idx) => {
      if (!noteIndices.includes(idx)) return note;
      return { ...note, ticks: quantizeNote(note.ticks, params) };
    });

    applyBatchEdit(updatedNotes); // single undo step
  }, [project, selectedTrackIndex, selectedNoteIds, applyBatchEdit]);

  // Chord detection with useMemo
  const detectedChords = useMemo(
    () => chordStripVisible
      ? detectChordsPerBar(notes, ppq, timeSignature)
      : [],
    [notes, ppq, timeSignature, chordStripVisible]
  );

  // Chord click handler — select all notes in the clicked bar
  const handleChordClick = useCallback((chord: DetectedChord) => {
    useEditStore.setState({
      selectedNoteIds: new Set(chord.noteIndices.map(idx => `${selectedTrackIndex}-${idx}`))
    });
  }, [selectedTrackIndex]);

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
    <div ref={outerRef} className="w-full overflow-hidden shrink-0" style={{ isolation: 'isolate', backgroundColor: '#0D1117' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#131824] border-b border-white/10">
        {/* Undo button */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-colors ${
            canUndo
              ? 'hover:bg-white/10 text-secondary hover:text-primary'
              : 'text-white/20 cursor-not-allowed'
          }`}
          title="Undo (Cmd+Z)"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 5 L3 10 L8 15 M3 10 L17 10 C17 10 17 8 14 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        {/* Redo button */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-colors ${
            canRedo
              ? 'hover:bg-white/10 text-secondary hover:text-primary'
              : 'text-white/20 cursor-not-allowed'
          }`}
          title="Redo (Cmd+Shift+Z)"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12 5 L17 10 L12 15 M17 10 L3 10 C3 10 3 8 6 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        <div className="h-5 w-px bg-white/10 mx-1"></div>

        {/* Theory controls */}
        <TheoryControls />

        <div className="h-5 w-px bg-white/10 mx-1"></div>

        {/* Ghost notes toggle */}
        <button
          onClick={() => setGhostNotesVisible(!ghostNotesVisible)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            ghostNotesVisible
              ? 'bg-[#dbeafe] text-[#1d4ed8]'
              : 'bg-white/5 text-secondary border border-white/10 hover:bg-white/10 hover:text-primary'
          }`}
          title={ghostNotesVisible ? 'Hide other tracks' : 'Show other tracks'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {ghostNotesVisible ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            )}
          </svg>
          Ghost
        </button>

        <div className="h-5 w-px bg-white/10 mx-1"></div>

        {/* Quantize popover */}
        <QuantizePopover ppq={ppq} onApply={applyQuantization} />

        <div className="h-5 w-px bg-white/10 mx-1"></div>

        {/* Velocity lane toggle */}
        <button
          onClick={() => setVelocityLaneVisible(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            velocityLaneVisible
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
              : 'bg-white/5 text-secondary border border-white/10 hover:bg-white/10 hover:text-primary'
          }`}
          title={velocityLaneVisible ? 'Hide velocity lane' : 'Show velocity lane'}
        >
          Vel
        </button>

        {/* Chord strip toggle */}
        <button
          onClick={() => setChordStripVisible(c => !c)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            chordStripVisible
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
              : 'bg-white/5 text-secondary border border-white/10 hover:bg-white/10 hover:text-primary'
          }`}
          title={chordStripVisible ? 'Hide chord symbols' : 'Show chord symbols'}
        >
          Chords
        </button>

        <div className="h-5 w-px bg-white/10 mx-1"></div>

        {/* Hotkey reference */}
        <HotkeyReference />

        <div className="h-5 w-px bg-white/10 mx-1"></div>

        {/* Project metadata stats */}
        <div className="flex items-center gap-3 text-xs text-tertiary">
          <span className="font-medium text-secondary">{Math.round(firstTempo?.bpm || 120)} BPM</span>
          <span>{firstTimeSig?.numerator ?? 4}/{firstTimeSig?.denominator ?? 4}</span>
          <span>{durationLabel}</span>
        </div>

        <div className="flex-1"></div>

        {/* Track name */}
        <div className="text-sm text-secondary font-medium">
          {selectedTrack?.name}
        </div>
      </div>

      {/* Timeline Ruler with embedded Transport Controls */}
      <TimelineRuler
        scrollX={scrollX}
        zoomX={zoomX}
        ppq={ppq}
        timeSignature={timeSignature}
        width={canvasWidth}
        playheadTicks={playheadTicks}
        isPlaying={playbackState === 'playing'}
        onSeek={handleSeek}
        durationTicks={durationTicks}
      />

      {/* Chord strip — shown between timeline ruler and note grid when enabled */}
      {chordStripVisible && (
        <ChordStrip
          chords={detectedChords}
          scrollX={scrollX}
          zoomX={zoomX}
          ppq={ppq}
          width={canvasWidth}
          onChordClick={handleChordClick}
        />
      )}

      {/* Validation feedback */}
      <ValidationFeedback />

      {/* Main editor area */}
      <div
        ref={containerRef}
        className="relative flex"
        style={{
          height: `${noteGridHeight}px`,
          overflow: 'hidden', // Prevent scrolling from bubbling to page
          touchAction: 'none', // Prevent touch gestures from affecting page scroll
        }}
      >
        {/* Piano keys sidebar */}
        <div className="flex-shrink-0">
          <PianoKeysSidebar scrollY={scrollY} height={noteGridHeight} zoomY={zoomY} />
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
            allTracks={allTracks}
            ghostNotesVisible={ghostNotesVisible}
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

      {/* Velocity lane — shown below note grid when enabled */}
      {velocityLaneVisible && (
        <>
          {/* Divider spans full width (piano keys + note grid) */}
          <div
            className="h-1.5 bg-[#131824] border-y border-white/10 hover:bg-cyan-500/10 transition-colors"
            style={{ cursor: 'row-resize' }}
            onMouseDown={handleDividerMouseDown}
          />
          {/* Offset canvas by PIANO_KEY_WIDTH so stalks align with notes above */}
          <div style={{ marginLeft: PIANO_KEY_WIDTH }}>
            <VelocityLane
              notes={notes}
              ppq={ppq}
              scrollX={scrollX}
              zoomX={zoomX}
              selectedNoteIds={selectedNoteIds}
              trackIndex={selectedTrackIndex}
              width={canvasWidth}
              height={velocityLaneHeight}
            />
          </div>
        </>
      )}

      {/* Zoom controls — bottom status bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#131824] border-t border-white/10 shrink-0">
        <ZoomControls
          zoomX={zoomX}
          zoomY={zoomY}
          onZoomXChange={setZoomX}
          onZoomYChange={setZoomY}
        />
        <div className="ml-auto text-xs text-tertiary">{ppq} PPQ</div>
      </div>
    </div>
  );
}
