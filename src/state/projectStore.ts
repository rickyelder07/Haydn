import { create } from 'zustand';
import type { HaydnProject, TrackDisplayInfo } from '@/lib/midi/types';

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
}));
