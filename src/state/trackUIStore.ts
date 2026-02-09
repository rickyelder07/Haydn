import { create } from 'zustand';

/**
 * Track UI state for multi-track support
 * Manages ephemeral playback/display state (mute, solo, order, ghost notes)
 * Separate from project data - resets when new project loads
 */
interface TrackUIState {
  // State
  mutedTracks: Set<number>;
  soloedTracks: Set<number>;
  trackOrder: number[]; // Display order (indices into project.tracks)
  ghostNotesVisible: boolean;

  // Actions
  toggleMute: (trackIndex: number) => void;
  toggleSolo: (trackIndex: number) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  setGhostNotesVisible: (visible: boolean) => void;
  resetAllStates: () => void;
  initializeOrder: (trackCount: number) => void;
  isTrackAudible: (trackIndex: number) => boolean;
}

export const useTrackUIStore = create<TrackUIState>((set, get) => ({
  // Initial state
  mutedTracks: new Set<number>(),
  soloedTracks: new Set<number>(),
  trackOrder: [],
  ghostNotesVisible: true,

  // Toggle mute for a track
  toggleMute: (trackIndex) => {
    set((state) => {
      const newMuted = new Set(state.mutedTracks);
      if (newMuted.has(trackIndex)) {
        newMuted.delete(trackIndex);
      } else {
        newMuted.add(trackIndex);
      }
      return { mutedTracks: newMuted };
    });

    // Sync to audio
    import('@/audio/playback/NoteScheduler').then(({ updateTrackMuteStates }) => {
      updateTrackMuteStates((trackIndex) => get().isTrackAudible(trackIndex));
    });
  },

  // Toggle solo for a track (non-exclusive - multiple tracks can be soloed)
  toggleSolo: (trackIndex) => {
    set((state) => {
      const newSoloed = new Set(state.soloedTracks);
      if (newSoloed.has(trackIndex)) {
        newSoloed.delete(trackIndex);
      } else {
        newSoloed.add(trackIndex);
      }
      return { soloedTracks: newSoloed };
    });

    // Sync to audio
    import('@/audio/playback/NoteScheduler').then(({ updateTrackMuteStates }) => {
      updateTrackMuteStates((trackIndex) => get().isTrackAudible(trackIndex));
    });
  },

  // Reorder tracks in display order
  reorderTracks: (fromIndex, toIndex) => {
    set((state) => {
      const newOrder = [...state.trackOrder];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return { trackOrder: newOrder };
    });
  },

  // Toggle ghost notes visibility
  setGhostNotesVisible: (visible) => {
    set({ ghostNotesVisible: visible });
  },

  // Reset all mute/solo states (global reset button)
  resetAllStates: () => {
    set({
      mutedTracks: new Set<number>(),
      soloedTracks: new Set<number>(),
    });

    // Unmute all tracks in audio
    import('@/audio/playback/NoteScheduler').then(({ updateTrackMuteStates }) => {
      updateTrackMuteStates(() => true); // All audible
    });
  },

  // Initialize track order when project loads
  initializeOrder: (trackCount) => {
    set({
      trackOrder: Array.from({ length: trackCount }, (_, i) => i),
      mutedTracks: new Set<number>(),
      soloedTracks: new Set<number>(),
    });
  },

  // Check if a track should play audio (computed based on mute/solo state)
  isTrackAudible: (trackIndex) => {
    const state = get();

    // Solo logic: if ANY track is soloed, only soloed tracks are audible
    if (state.soloedTracks.size > 0) {
      return state.soloedTracks.has(trackIndex);
    }

    // No solos: only non-muted tracks are audible
    return !state.mutedTracks.has(trackIndex);
  },
}));
