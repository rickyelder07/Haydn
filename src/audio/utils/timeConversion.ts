import type { HaydnMetadata, HaydnTempo } from '@/lib/midi/types';

/**
 * Convert MIDI ticks to seconds, accounting for tempo changes.
 * Uses linear interpolation between tempo events.
 */
export function ticksToSeconds(
  ticks: number,
  ppq: number,
  tempos: HaydnTempo[]
): number {
  if (tempos.length === 0) {
    // Default 120 BPM if no tempo events
    return (ticks / ppq) * (60 / 120);
  }

  // Sort tempos by tick position
  const sortedTempos = [...tempos].sort((a, b) => a.ticks - b.ticks);

  let totalSeconds = 0;
  let currentTick = 0;
  let currentBpm = sortedTempos[0]?.bpm || 120;

  for (const tempo of sortedTempos) {
    if (tempo.ticks >= ticks) break;

    // Add time from currentTick to this tempo change
    const ticksInSegment = tempo.ticks - currentTick;
    const secondsInSegment = (ticksInSegment / ppq) * (60 / currentBpm);
    totalSeconds += secondsInSegment;

    currentTick = tempo.ticks;
    currentBpm = tempo.bpm;
  }

  // Add remaining time from last tempo change to target tick
  const remainingTicks = ticks - currentTick;
  const remainingSeconds = (remainingTicks / ppq) * (60 / currentBpm);
  totalSeconds += remainingSeconds;

  return totalSeconds;
}

/**
 * Convert seconds back to ticks (for seeking).
 */
export function secondsToTicks(
  seconds: number,
  ppq: number,
  tempos: HaydnTempo[]
): number {
  if (tempos.length === 0) {
    return Math.round(seconds * (120 / 60) * ppq);
  }

  const sortedTempos = [...tempos].sort((a, b) => a.ticks - b.ticks);

  let totalTicks = 0;
  let currentSecond = 0;
  let currentBpm = sortedTempos[0]?.bpm || 120;

  for (let i = 0; i < sortedTempos.length; i++) {
    const tempo = sortedTempos[i];
    const nextTempo = sortedTempos[i + 1];

    // Calculate how many seconds this tempo segment spans
    const ticksInSegment = nextTempo
      ? nextTempo.ticks - tempo.ticks
      : Infinity;
    const secondsInSegment = (ticksInSegment / ppq) * (60 / tempo.bpm);

    if (currentSecond + secondsInSegment > seconds) {
      // Target is within this segment
      const remainingSeconds = seconds - currentSecond;
      const remainingTicks = (remainingSeconds * (tempo.bpm / 60) * ppq);
      return Math.round(totalTicks + remainingTicks);
    }

    totalTicks += ticksInSegment;
    currentSecond += secondsInSegment;
    currentBpm = nextTempo?.bpm || currentBpm;
  }

  // Past all tempo events, use last tempo
  const remainingSeconds = seconds - currentSecond;
  return Math.round(totalTicks + (remainingSeconds * (currentBpm / 60) * ppq));
}

/**
 * Convert ticks to bars:beats:sixteenths format.
 */
export function ticksToBarsBeat(
  ticks: number,
  ppq: number,
  timeSignatureNumerator: number = 4,
  timeSignatureDenominator: number = 4
): string {
  const ticksPerBeat = ppq * (4 / timeSignatureDenominator);
  const ticksPerBar = ticksPerBeat * timeSignatureNumerator;
  const ticksPerSixteenth = ppq / 4;

  const bars = Math.floor(ticks / ticksPerBar) + 1; // 1-indexed
  const remainingAfterBars = ticks % ticksPerBar;
  const beats = Math.floor(remainingAfterBars / ticksPerBeat) + 1; // 1-indexed
  const remainingAfterBeats = remainingAfterBars % ticksPerBeat;
  const sixteenths = Math.floor(remainingAfterBeats / ticksPerSixteenth) + 1;

  return `${bars}.${beats}.${sixteenths}`;
}

/**
 * Format seconds as mm:ss display string.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert MIDI note number to note name (e.g., 60 -> "C4").
 */
export function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}
