'use client';

import { Draw, Transport } from 'tone';
import { useState, useEffect, useMemo } from 'react';
import type { HaydnProject, HaydnNote } from '@/lib/midi/types';
import { ticksToSeconds } from '@/audio/utils/timeConversion';

// Store for currently playing notes
type ActiveNoteId = string; // Format: "trackIndex-noteIndex"
type NoteHighlightCallback = (activeNotes: Set<ActiveNoteId>) => void;

class NoteHighlighterClass {
  private static instance: NoteHighlighterClass | null = null;
  private activeNotes: Set<ActiveNoteId> = new Set();
  private scheduledEvents: number[] = [];
  private listeners: Set<NoteHighlightCallback> = new Set();
  private project: HaydnProject | null = null;

  private constructor() {}

  static getInstance(): NoteHighlighterClass {
    if (!NoteHighlighterClass.instance) {
      NoteHighlighterClass.instance = new NoteHighlighterClass();
    }
    return NoteHighlighterClass.instance;
  }

  /**
   * Schedule note highlights for a project.
   * Must be called after notes are scheduled to Transport.
   */
  scheduleHighlights(project: HaydnProject): void {
    this.clear();
    this.project = project;

    const { ppq, tempos } = project.metadata;

    project.tracks.forEach((track, trackIndex) => {
      track.notes.forEach((note, noteIndex) => {
        const noteId: ActiveNoteId = `${trackIndex}-${noteIndex}`;
        const startTime = ticksToSeconds(note.ticks, ppq, tempos);
        const endTime = ticksToSeconds(note.ticks + note.durationTicks, ppq, tempos);

        // Schedule highlight on (uses Tone.Draw for UI sync per RESEARCH.md)
        const onId = Transport.schedule((time) => {
          Draw.schedule(() => {
            this.activeNotes.add(noteId);
            this.notifyListeners();
          }, time);
        }, startTime);
        this.scheduledEvents.push(onId);

        // Schedule highlight off
        const offId = Transport.schedule((time) => {
          Draw.schedule(() => {
            this.activeNotes.delete(noteId);
            this.notifyListeners();
          }, time);
        }, endTime);
        this.scheduledEvents.push(offId);
      });
    });
  }

  /**
   * Clear all scheduled highlights.
   */
  clear(): void {
    this.scheduledEvents.forEach(id => Transport.clear(id));
    this.scheduledEvents = [];
    this.activeNotes.clear();
    this.notifyListeners();
  }

  /**
   * Get currently active (playing) notes.
   */
  getActiveNotes(): Set<ActiveNoteId> {
    return new Set(this.activeNotes);
  }

  /**
   * Check if a specific note is currently playing.
   */
  isNoteActive(trackIndex: number, noteIndex: number): boolean {
    return this.activeNotes.has(`${trackIndex}-${noteIndex}`);
  }

  /**
   * Subscribe to highlight changes.
   */
  subscribe(callback: NoteHighlightCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const snapshot = this.getActiveNotes();
    this.listeners.forEach(cb => cb(snapshot));
  }
}

export const NoteHighlighter = NoteHighlighterClass.getInstance();

/**
 * React hook for consuming note highlight state.
 * Returns set of currently playing note IDs.
 */
export function useNoteHighlighter(): {
  activeNotes: Set<ActiveNoteId>;
  isNoteActive: (trackIndex: number, noteIndex: number) => boolean;
  activeNoteCountByTrack: Map<number, number>;
} {
  const [activeNotes, setActiveNotes] = useState<Set<ActiveNoteId>>(new Set());

  useEffect(() => {
    // Get initial state
    setActiveNotes(NoteHighlighter.getActiveNotes());

    // Subscribe to changes
    const unsubscribe = NoteHighlighter.subscribe((notes) => {
      setActiveNotes(notes);
    });

    return unsubscribe;
  }, []);

  // Memoize helper functions
  const isNoteActive = useMemo(() => {
    return (trackIndex: number, noteIndex: number) =>
      activeNotes.has(`${trackIndex}-${noteIndex}`);
  }, [activeNotes]);

  const activeNoteCountByTrack = useMemo(() => {
    const counts = new Map<number, number>();
    activeNotes.forEach(noteId => {
      const trackIndex = parseInt(noteId.split('-')[0], 10);
      counts.set(trackIndex, (counts.get(trackIndex) || 0) + 1);
    });
    return counts;
  }, [activeNotes]);

  return { activeNotes, isNoteActive, activeNoteCountByTrack };
}
