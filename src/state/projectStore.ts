import { create } from 'zustand';
import type { HaydnProject, TrackDisplayInfo, HaydnTrack } from '@/lib/midi/types';
import { getInstrumentName } from '@/lib/instruments/gm-mapping';
import { useTrackUIStore } from './trackUIStore';
import { useEditStore } from './editStore';

interface ProjectState {
  // Data
  project: HaydnProject | null;
  isLoading: boolean;
  error: string | null;

  // Computed display info
  trackDisplayInfo: TrackDisplayInfo[];

  // Actions
  setProject: (project: HaydnProject) => void;
  clearProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateTrackName: (trackIndex: number, name: string) => void;
  addTrack: (instrumentNumber: number, name?: string) => void;
  removeTrack: (trackIndex: number) => void;
}

// Helper to compute display info from project
function computeTrackDisplayInfo(project: HaydnProject): TrackDisplayInfo[] {
  const ppq = project.metadata.ppq;
  const baseTempo = project.metadata.tempos[0]?.bpm || 120;

  return project.tracks.map((track) => {
    // Calculate duration in seconds (simplified - uses first tempo only)
    const lastNote = track.notes.reduce((max, note) => {
      const endTick = note.ticks + note.durationTicks;
      return endTick > max ? endTick : max;
    }, 0);

    const durationSeconds = (lastNote / ppq) * (60 / baseTempo);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);

    return {
      name: track.name,
      instrumentName: track.instrumentName,
      noteCount: track.notes.length,
      durationSeconds,
      formattedDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    };
  });
}

/**
 * Helper to find next available MIDI channel for a new track
 * Prefers channels 0-15, skips channel 9 (percussion) unless all others used
 */
function findNextAvailableChannel(project: HaydnProject): number {
  const usedChannels = new Set(project.tracks.map(t => t.channel));

  // Try channels 0-15, prefer non-percussion (skip 9 unless all others used)
  for (let ch = 0; ch < 16; ch++) {
    if (ch === 9) continue; // Skip percussion channel
    if (!usedChannels.has(ch)) return ch;
  }

  // All non-percussion channels used, use 9 or default to 0
  return usedChannels.has(9) ? 0 : 9;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  isLoading: false,
  error: null,
  trackDisplayInfo: [],

  setProject: (project) =>
    set({
      project,
      trackDisplayInfo: computeTrackDisplayInfo(project),
      error: null,
    }),

  clearProject: () =>
    set({
      project: null,
      trackDisplayInfo: [],
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  updateTrackName: (trackIndex, name) =>
    set((state) => {
      if (!state.project) return state;

      const newTracks = [...state.project.tracks];
      if (trackIndex >= 0 && trackIndex < newTracks.length) {
        newTracks[trackIndex] = { ...newTracks[trackIndex], name };
      }

      const newProject = { ...state.project, tracks: newTracks };
      return {
        project: newProject,
        trackDisplayInfo: computeTrackDisplayInfo(newProject),
      };
    }),

  addTrack: (instrumentNumber, name) =>
    set((state) => {
      if (!state.project) return state;

      // Check track count limit (max 32)
      if (state.project.tracks.length >= 32) {
        return state;
      }

      // Create new track
      const newTrack: HaydnTrack = {
        name: name || `${getInstrumentName(instrumentNumber)} Track`,
        channel: findNextAvailableChannel(state.project),
        instrumentNumber,
        instrumentName: getInstrumentName(instrumentNumber),
        notes: [],
        controlChanges: [],
      };

      // Add track to project
      const newTracks = [...state.project.tracks, newTrack];
      const newProject = { ...state.project, tracks: newTracks };

      // Update trackUIStore order
      useTrackUIStore.getState().initializeOrder(newTracks.length);

      return {
        project: newProject,
        trackDisplayInfo: computeTrackDisplayInfo(newProject),
      };
    }),

  removeTrack: (trackIndex) =>
    set((state) => {
      if (!state.project) return state;

      // Validate trackIndex bounds
      if (trackIndex < 0 || trackIndex >= state.project.tracks.length) {
        return state;
      }

      // Check minimum: keep at least 1 track
      if (state.project.tracks.length <= 1) {
        return state;
      }

      // Remove track from array
      const newTracks = state.project.tracks.filter((_, i) => i !== trackIndex);
      const newProject = { ...state.project, tracks: newTracks };

      // Update trackUIStore: re-initialize order with new count
      useTrackUIStore.getState().initializeOrder(newTracks.length);

      // If editStore.selectedTrackIndex was removed, clear selection
      const editState = useEditStore.getState();
      if (editState.selectedTrackIndex === trackIndex) {
        editState.selectTrack(Math.max(0, trackIndex - 1));
      } else if (editState.selectedTrackIndex !== null && editState.selectedTrackIndex > trackIndex) {
        // Adjust selected index if it's after the removed track
        editState.selectTrack(editState.selectedTrackIndex - 1);
      }

      return {
        project: newProject,
        trackDisplayInfo: computeTrackDisplayInfo(newProject),
      };
    }),
}));
