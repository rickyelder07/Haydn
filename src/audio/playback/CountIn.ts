import { Transport, MembraneSynth, now } from 'tone';

interface CountInOptions {
  bars: number; // 1-4 bars of count-in
  onComplete?: () => void;
}

// Track active count-in to allow cancellation
let activeCountIn: {
  timeoutId: number;
  synth: MembraneSynth;
  reject: (reason: Error) => void;
} | null = null;

/**
 * Cancel any active count-in.
 */
export function cancelCountIn(): void {
  if (activeCountIn) {
    clearTimeout(activeCountIn.timeoutId);
    activeCountIn.synth.dispose();
    activeCountIn.reject(new Error('Count-in cancelled'));
    activeCountIn = null;
  }
}

/**
 * Play count-in clicks before starting playback.
 * Per CONTEXT.md: Configurable 1-4 bars before playback starts.
 */
export async function playCountIn(options: CountInOptions): Promise<void> {
  const { bars, onComplete } = options;

  // Cancel any existing count-in
  cancelCountIn();

  if (bars <= 0) {
    onComplete?.();
    return;
  }

  // Create synth for count-in (separate from metronome to avoid conflicts)
  const synth = new MembraneSynth({
    pitchDecay: 0.008,
    octaves: 4,
    envelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      release: 0.1,
    },
  }).toDestination();

  synth.volume.value = -3; // Slightly louder than metronome during count-in

  // Get time signature
  const beatsPerBar = Array.isArray(Transport.timeSignature)
    ? Transport.timeSignature[0]
    : Transport.timeSignature;

  const totalBeats = bars * beatsPerBar;
  const bpm = Transport.bpm.value;
  const secondsPerBeat = 60 / bpm;

  return new Promise<void>((resolve, reject) => {
    const startTime = now();

    // Schedule count-in beats
    for (let i = 0; i < totalBeats; i++) {
      const beatTime = startTime + (i * secondsPerBeat);
      const isDownbeat = i % beatsPerBar === 0;

      // Higher pitch and volume for downbeats
      const frequency = isDownbeat ? 880 : 440;
      const velocity = isDownbeat ? 0.9 : 0.6;

      synth.triggerAttackRelease(frequency, '32n', beatTime, velocity);
    }

    // Wait for count-in to complete, then resolve
    const countInDuration = totalBeats * secondsPerBeat;

    const timeoutId = window.setTimeout(() => {
      synth.dispose();
      activeCountIn = null;
      onComplete?.();
      resolve();
    }, countInDuration * 1000);

    // Track active count-in for cancellation
    activeCountIn = { timeoutId, synth, reject };
  });
}

/**
 * Start playback with optional count-in.
 * Combines count-in and Transport.start().
 */
export async function startWithCountIn(countInBars: number): Promise<void> {
  if (countInBars > 0) {
    await playCountIn({
      bars: countInBars,
      onComplete: () => {
        Transport.start();
      },
    });
  } else {
    Transport.start();
  }
}
