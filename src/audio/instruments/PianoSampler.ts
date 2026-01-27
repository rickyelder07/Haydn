import { PolySynth, Synth } from 'tone';

export interface InstrumentInstance {
  load(): Promise<void>;
  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void;
  releaseAll(): void;
  dispose(): void;
}

export class PianoSampler implements InstrumentInstance {
  private synth: PolySynth;

  constructor() {
    // Use PolySynth with piano-like settings
    // @tonejs/piano was causing CDN loading issues, using synth instead
    this.synth = new PolySynth(Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 1.5,
      },
    }).toDestination();

    // Slightly reduce volume
    this.synth.volume.value = -3;
  }

  async load(): Promise<void> {
    // Synths don't need loading
    return Promise.resolve();
  }

  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void {
    // Ensure minimum duration (some MIDI files have zero-duration notes)
    const safeDuration = Math.max(duration, 0.05);
    this.synth.triggerAttackRelease(note, safeDuration, time, velocity);
  }

  releaseAll(): void {
    this.synth.releaseAll();
  }

  dispose(): void {
    this.synth.dispose();
  }
}
