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
    this.synth.triggerAttackRelease(note, duration, time, velocity);
  }

  releaseAll(): void {
    this.synth.releaseAll();
  }

  dispose(): void {
    this.synth.dispose();
  }
}
