import { create } from 'zustand';
import { getPlaybackController, type PlaybackState, type PlaybackPosition } from '@/audio/playback/PlaybackController';
import { formatTime, ticksToBarsBeat } from '@/audio/utils/timeConversion';
import type { HaydnProject } from '@/lib/midi/types';
import { startWithCountIn, cancelCountIn } from '@/audio/playback/CountIn';
import { getMetronome } from '@/audio/playback/Metronome';

interface PlaybackStoreState {
  // State
  playbackState: PlaybackState;
  position: PlaybackPosition;
  duration: number;
  tempo: number;
  isLoading: boolean;
  countInBars: number;
  metronomeEnabled: boolean;
  isCountingIn: boolean;

  // Computed display values
  formattedPosition: string;
  formattedDuration: string;
  barsBeatsPosition: string;
  progress: number; // 0-1

  // Actions
  loadProject: (project: HaydnProject) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => void;
  seekToProgress: (progress: number) => void;
  setTempo: (bpm: number) => void;
  setCountInBars: (bars: number) => void;
  setMetronomeEnabled: (enabled: boolean) => void;
}

// Singleton subscription management
let subscribed = false;

function subscribeToController(set: (state: Partial<PlaybackStoreState>) => void, get: () => PlaybackStoreState) {
  if (subscribed) return;
  subscribed = true;

  const controller = getPlaybackController();

  controller.onStateChange((playbackState) => {
    set({ playbackState });
  });

  controller.onPositionChange((position) => {
    const state = get();
    const duration = state.duration;

    set({
      position,
      formattedPosition: formatTime(position.seconds),
      barsBeatsPosition: ticksToBarsBeat(position.ticks, 480), // Default PPQ, updated on project load
      progress: duration > 0 ? position.seconds / duration : 0,
    });
  });

  controller.onEnd(() => {
    // Playback ended, state already updated via onStateChange
  });
}

export const usePlaybackStore = create<PlaybackStoreState>((set, get) => {
  // Subscribe to controller on store creation
  // Deferred to first action to avoid SSR issues
  let initialized = false;

  const ensureInitialized = () => {
    if (typeof window !== 'undefined' && !initialized) {
      initialized = true;
      subscribeToController(set, get);
    }
  };

  return {
    // Initial state
    playbackState: 'stopped',
    position: { seconds: 0, ticks: 0 },
    duration: 0,
    tempo: 120,
    isLoading: false,
    countInBars: 0,
    metronomeEnabled: false,
    isCountingIn: false,

    formattedPosition: '0:00',
    formattedDuration: '0:00',
    barsBeatsPosition: '1.1.1',
    progress: 0,

    // Actions
    loadProject: async (project) => {
      ensureInitialized();
      set({ isLoading: true });

      try {
        const controller = getPlaybackController();
        await controller.loadProject(project);

        const duration = controller.getDuration();
        const tempo = controller.getTempo();

        set({
          duration,
          tempo,
          formattedDuration: formatTime(duration),
          isLoading: false,
          playbackState: 'stopped',
          position: { seconds: 0, ticks: 0 },
          formattedPosition: '0:00',
          barsBeatsPosition: '1.1.1',
          progress: 0,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    play: async () => {
      ensureInitialized();
      const state = get();
      const controller = getPlaybackController();

      if (state.playbackState === 'paused') {
        // Resume without count-in
        await controller.play();
        // Start metronome if enabled
        if (state.metronomeEnabled && !getMetronome().isEnabled()) {
          getMetronome().start();
        }
      } else {
        // Start with count-in if enabled
        if (state.countInBars > 0) {
          // Set state to playing so pause works during count-in
          set({ playbackState: 'playing', isCountingIn: true });

          try {
            await startWithCountIn(state.countInBars);
            // Count-in completed, now start actual playback
            set({ isCountingIn: false });
            await controller.play();
            // Start metronome after count-in if enabled
            if (state.metronomeEnabled) {
              getMetronome().start();
            }
          } catch (error) {
            // Count-in was cancelled or failed
            set({ playbackState: 'stopped', isCountingIn: false });
            throw error;
          }
        } else {
          await controller.play();
          // Start metronome if enabled
          if (state.metronomeEnabled) {
            getMetronome().start();
          }
        }
      }
    },

    pause: () => {
      ensureInitialized();
      const state = get();

      // If counting in, cancel it and stop
      if (state.isCountingIn) {
        cancelCountIn();
        set({ playbackState: 'stopped', isCountingIn: false });
        getMetronome().stop();
        return;
      }

      // Normal pause
      const controller = getPlaybackController();
      controller.pause();
      // Stop metronome during pause
      getMetronome().stop();
    },

    stop: () => {
      ensureInitialized();
      const controller = getPlaybackController();
      controller.stop();
      // Stop metronome on stop
      getMetronome().stop();
    },

    togglePlayPause: async () => {
      ensureInitialized();
      const state = get();
      if (state.playbackState === 'playing') {
        get().pause();
      } else {
        await get().play();
      }
    },

    seekTo: (seconds) => {
      ensureInitialized();
      const controller = getPlaybackController();
      controller.seekTo(seconds);
    },

    seekToProgress: (progress) => {
      const duration = get().duration;
      get().seekTo(progress * duration);
    },

    setTempo: (bpm) => {
      ensureInitialized();
      const controller = getPlaybackController();
      controller.setTempo(bpm);
      set({ tempo: bpm });
    },

    setCountInBars: (bars) => set({ countInBars: bars }),

    setMetronomeEnabled: (enabled) => {
      set({ metronomeEnabled: enabled });
    },
  };
});
