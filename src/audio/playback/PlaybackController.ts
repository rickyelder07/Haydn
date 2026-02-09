import { Transport } from 'tone';
import type { HaydnProject } from '@/lib/midi/types';
import { getAudioEngine } from '@/audio/AudioEngine';
import { scheduleNotes, clearScheduledNotes, disposeAllInstruments, updateTrackMuteStates } from './NoteScheduler';
import { ticksToSeconds } from '@/audio/utils/timeConversion';
import { NoteHighlighter } from './NoteHighlighter';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface PlaybackPosition {
  seconds: number;
  ticks: number;
}

type StateChangeCallback = (state: PlaybackState) => void;
type PositionChangeCallback = (position: PlaybackPosition) => void;
type EndCallback = () => void;

class PlaybackController {
  private static instance: PlaybackController | null = null;
  private currentProject: HaydnProject | null = null;
  private state: PlaybackState = 'stopped';
  private positionIntervalId: number | null = null;

  private stateListeners: Set<StateChangeCallback> = new Set();
  private positionListeners: Set<PositionChangeCallback> = new Set();
  private endListeners: Set<EndCallback> = new Set();

  private constructor() {
    // Listen for transport end
    Transport.on('stop', () => {
      this.handleTransportStop();
    });
  }

  static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController();
    }
    return PlaybackController.instance;
  }

  /**
   * Load a project for playback.
   */
  async loadProject(project: HaydnProject): Promise<void> {
    // Stop any current playback
    if (this.state !== 'stopped') {
      this.stop();
    }

    // Dispose old instruments if loading new project
    if (this.currentProject) {
      disposeAllInstruments();
    }

    this.currentProject = project;

    // Initialize audio engine (handles autoplay policy)
    await getAudioEngine().initialize();

    // Schedule all notes
    await scheduleNotes(project);

    // Apply initial mute/solo states (all unmuted by default)
    this.syncMuteStates();

    // Schedule note highlights for UI feedback
    NoteHighlighter.scheduleHighlights(project);
  }

  /**
   * Start or resume playback.
   */
  async play(): Promise<void> {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }

    // Ensure audio is initialized (user gesture required)
    await getAudioEngine().initialize();

    if (this.state === 'paused') {
      // Resume from current position
      Transport.start();
    } else {
      // Start from beginning or current position
      Transport.start();
    }

    this.setState('playing');
    this.startPositionTracking();
  }

  /**
   * Pause playback at current position.
   */
  pause(): void {
    if (this.state !== 'playing') return;

    Transport.pause();
    this.setState('paused');
    this.stopPositionTracking();
  }

  /**
   * Stop playback and return to beginning.
   */
  stop(): void {
    Transport.stop();
    Transport.position = 0;
    clearScheduledNotes();

    // Clear note highlights
    NoteHighlighter.clear();

    // Re-schedule notes for next play
    if (this.currentProject) {
      scheduleNotes(this.currentProject);
      // Reapply mute/solo states from trackUIStore
      this.syncMuteStates();
    }

    this.setState('stopped');
    this.stopPositionTracking();
    this.notifyPosition({ seconds: 0, ticks: 0 });
  }

  /**
   * Seek to a specific position in seconds.
   */
  seekTo(seconds: number): void {
    const wasPlaying = this.state === 'playing';

    if (wasPlaying) {
      Transport.pause();
    }

    Transport.seconds = seconds;

    if (wasPlaying) {
      Transport.start();
    }

    this.notifyPosition(this.getCurrentPosition());
  }

  /**
   * Get current playback position.
   */
  getCurrentPosition(): PlaybackPosition {
    if (!this.currentProject) {
      return { seconds: 0, ticks: 0 };
    }

    const seconds = Transport.seconds;
    // Approximate ticks from seconds (simplified, doesn't account for tempo changes)
    const ppq = this.currentProject.metadata.ppq;
    const bpm = Transport.bpm.value;
    const ticks = Math.round((seconds * bpm / 60) * ppq);

    return { seconds, ticks };
  }

  /**
   * Get current playback state.
   */
  getState(): PlaybackState {
    return this.state;
  }

  /**
   * Get total duration in seconds.
   */
  getDuration(): number {
    if (!this.currentProject) return 0;

    const { ppq, tempos } = this.currentProject.metadata;
    return ticksToSeconds(this.currentProject.durationTicks, ppq, tempos);
  }

  /**
   * Set tempo (BPM). Can be called during playback.
   */
  setTempo(bpm: number): void {
    // Clamp to valid range per CONTEXT.md
    const clampedBpm = Math.max(40, Math.min(240, bpm));

    // Schedule tempo change slightly ahead for smooth transition per RESEARCH.md
    const now = Transport.immediate();
    Transport.bpm.setValueAtTime(clampedBpm, now + 0.1);
  }

  /**
   * Get current tempo.
   */
  getTempo(): number {
    return Transport.bpm.value;
  }

  // Listener management
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  onPositionChange(callback: PositionChangeCallback): () => void {
    this.positionListeners.add(callback);
    return () => this.positionListeners.delete(callback);
  }

  onEnd(callback: EndCallback): () => void {
    this.endListeners.add(callback);
    return () => this.endListeners.delete(callback);
  }

  // Private methods
  private setState(newState: PlaybackState): void {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }

  private notifyPosition(position: PlaybackPosition): void {
    this.positionListeners.forEach(cb => cb(position));
  }

  private startPositionTracking(): void {
    this.stopPositionTracking();

    // Update position every 50ms (20fps) - smooth enough for UI
    this.positionIntervalId = window.setInterval(() => {
      const position = this.getCurrentPosition();
      this.notifyPosition(position);

      // Check if we've reached the end
      const duration = this.getDuration();
      if (position.seconds >= duration) {
        this.handlePlaybackEnd();
      }
    }, 50);
  }

  private stopPositionTracking(): void {
    if (this.positionIntervalId !== null) {
      clearInterval(this.positionIntervalId);
      this.positionIntervalId = null;
    }
  }

  private handleTransportStop(): void {
    // Transport stopped externally
    if (this.state === 'playing') {
      this.setState('stopped');
      this.stopPositionTracking();
    }
  }

  private handlePlaybackEnd(): void {
    // Per CONTEXT.md: Stop and reset to start at end of track
    this.stop();
    this.endListeners.forEach(cb => cb());
  }

  /**
   * Sync track mute states from trackUIStore to NoteScheduler.
   * Call after scheduleNotes() to preserve mute/solo states.
   */
  private syncMuteStates(): void {
    // Dynamically import to avoid circular dependency
    import('@/state/trackUIStore').then(({ useTrackUIStore }) => {
      const { isTrackAudible } = useTrackUIStore.getState();
      updateTrackMuteStates((trackIndex) => isTrackAudible(trackIndex));
    });
  }
}

export const getPlaybackController = () => PlaybackController.getInstance();
export { PlaybackController };
