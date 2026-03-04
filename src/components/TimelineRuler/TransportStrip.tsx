'use client';

import { usePlaybackStore } from '@/state/playbackStore';
import { useMidiInputStore } from '@/state/midiInputStore';
import { useEditStore } from '@/state/editStore';
import { TempoDisplay } from '@/components/TransportControls/TempoDisplay';

// Inline SVG icons sized for compact strip
const PlayIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const LoopIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

interface TransportStripProps {
  /** Width of this strip in pixels (should match PIANO_KEY_WIDTH) */
  width?: number;
}

export function TransportStrip({ width = 180 }: TransportStripProps) {
  const playbackState = usePlaybackStore((state) => state.playbackState);
  const isLoading = usePlaybackStore((state) => state.isLoading);
  const tempo = usePlaybackStore((state) => state.tempo);
  const togglePlayPause = usePlaybackStore((state) => state.togglePlayPause);
  const stop = usePlaybackStore((state) => state.stop);
  const setTempo = usePlaybackStore((state) => state.setTempo);

  const isConnected = useMidiInputStore(s => s.isConnected);
  const isArmed = useMidiInputStore(s => s.isArmed);
  const isRecording = useMidiInputStore(s => s.isRecording);
  const setArmed = useMidiInputStore(s => s.setArmed);
  const startRecordingWithCountIn = useMidiInputStore(s => s.startRecordingWithCountIn);
  const commitRecording = useMidiInputStore(s => s.commitRecording);
  const selectedTrackIndex = useEditStore(s => s.selectedTrackIndex);

  const isPlaying = playbackState === 'playing';
  const canInteract = !isLoading;

  const handlePlayClick = async () => {
    if (isArmed && playbackState === 'stopped') {
      // Armed + stopped: start count-in → record → play
      await startRecordingWithCountIn();
    } else if (isArmed && playbackState === 'playing') {
      // Armed + playing: stop recording and commit notes, then stop playback
      if (selectedTrackIndex !== null) {
        commitRecording(selectedTrackIndex);
      }
      stop();
    } else {
      // Normal play/pause when not armed
      await togglePlayPause();
    }
  };

  const handleStopClick = () => {
    if (isArmed && isRecording && selectedTrackIndex !== null) {
      commitRecording(selectedTrackIndex);
    }
    stop();
  };

  return (
    <div
      className="flex-shrink-0 flex items-center gap-1.5 px-2 bg-gray-800/60 border-r border-white/10"
      style={{ width: `${width}px` }}
    >
      {/* Play/Pause button */}
      <button
        onClick={handlePlayClick}
        disabled={!canInteract}
        className="p-1 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-cyan-400 transition-colors"
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      {/* Stop button */}
      <button
        onClick={handleStopClick}
        disabled={!canInteract}
        className="p-1 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-amber-400 transition-colors"
        title="Stop (Enter)"
        aria-label="Stop"
      >
        <StopIcon />
      </button>

      {/* Record arm button — only visible when MIDI connected */}
      {isConnected && (
        <button
          onClick={() => setArmed(!isArmed)}
          className={[
            'p-1 rounded transition-colors text-xs font-bold leading-none',
            isArmed
              ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
              : 'hover:bg-white/10 text-gray-500 hover:text-red-400 border border-transparent',
          ].join(' ')}
          title={isArmed ? 'Disarm recording' : 'Arm for recording'}
          aria-label={isArmed ? 'Disarm recording' : 'Arm for recording'}
        >
          {/* Record circle icon */}
          <span className="block w-3 h-3 rounded-full border-2 border-current" />
        </button>
      )}

      {/* Recording indicator — pulsing red dot when recording active */}
      {isRecording && (
        <span
          className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"
          title="Recording..."
          aria-label="Recording active"
        />
      )}

      {/* Loading label — visible only during CDN sample fetch */}
      {isLoading && (
        <span className="text-[10px] text-cyan-400/70 mono whitespace-nowrap">
          Loading samples...
        </span>
      )}

      {/* Loop toggle (visual placeholder — loop state TBD in future phase) */}
      <button
        className="p-1 rounded hover:bg-white/10 text-gray-600 cursor-not-allowed opacity-50"
        title="Loop (coming soon)"
        aria-label="Loop"
        disabled
      >
        <LoopIcon active={false} />
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-white/10 mx-0.5" />

      {/* Tempo display */}
      <TempoDisplay tempo={tempo} onTempoChange={setTempo} />
    </div>
  );
}
