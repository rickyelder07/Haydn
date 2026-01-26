import { Transport, MembraneSynth } from 'tone';

class MetronomeClass {
  private static instance: MetronomeClass | null = null;
  private synth: MembraneSynth;
  private eventId: number | null = null;
  private enabled = false;

  private constructor() {
    // MembraneSynth produces a nice "click" sound
    this.synth = new MembraneSynth({
      pitchDecay: 0.008,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();

    // Reduce volume to not overpower music
    this.synth.volume.value = -6;
  }

  static getInstance(): MetronomeClass {
    if (!MetronomeClass.instance) {
      MetronomeClass.instance = new MetronomeClass();
    }
    return MetronomeClass.instance;
  }

  /**
   * Start metronome. Will click on every beat.
   * Downbeat (first beat of bar) is higher pitch.
   */
  start(): void {
    if (this.eventId !== null) return; // Already started

    this.enabled = true;

    // Get time signature for downbeat detection
    const getBeatsPerBar = () => {
      const ts = Transport.timeSignature;
      return Array.isArray(ts) ? ts[0] : ts;
    };

    let beatCount = 0;

    this.eventId = Transport.scheduleRepeat((time) => {
      const beatsPerBar = getBeatsPerBar();
      const isDownbeat = beatCount % beatsPerBar === 0;

      // Higher pitch (880Hz) for downbeat, lower (440Hz) for others
      const frequency = isDownbeat ? 880 : 440;
      // Slightly louder downbeat
      const velocity = isDownbeat ? 0.7 : 0.5;

      this.synth.triggerAttackRelease(frequency, '32n', time, velocity);

      beatCount++;
    }, '4n'); // Every quarter note
  }

  /**
   * Stop metronome clicks.
   */
  stop(): void {
    if (this.eventId !== null) {
      Transport.clear(this.eventId);
      this.eventId = null;
    }
    this.enabled = false;
  }

  /**
   * Toggle metronome on/off.
   */
  toggle(): boolean {
    if (this.enabled) {
      this.stop();
    } else {
      this.start();
    }
    return this.enabled;
  }

  /**
   * Check if metronome is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set metronome volume (-60 to 0 dB).
   */
  setVolume(db: number): void {
    this.synth.volume.value = Math.max(-60, Math.min(0, db));
  }

  /**
   * Dispose metronome resources.
   */
  dispose(): void {
    this.stop();
    this.synth.dispose();
  }
}

export const getMetronome = () => MetronomeClass.getInstance();
export { MetronomeClass as Metronome };
