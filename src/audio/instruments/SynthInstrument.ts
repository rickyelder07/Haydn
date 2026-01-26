import { PolySynth, Synth } from 'tone';
import type { InstrumentInstance } from './PianoSampler';

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export class SynthInstrument implements InstrumentInstance {
  private synth: PolySynth;

  constructor(gmProgram: number) {
    const waveform = this.getWaveformForProgram(gmProgram);

    this.synth = new PolySynth(Synth, {
      oscillator: { type: waveform },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1.0
      }
    }).toDestination();
  }

  private getWaveformForProgram(program: number): OscillatorType {
    // GM program mapping from RESEARCH.md
    if (program >= 0 && program <= 7) return 'triangle';    // Piano/Chromatic
    if (program >= 8 && program <= 15) return 'sine';       // Percussion
    if (program >= 16 && program <= 23) return 'sawtooth';  // Organ
    if (program >= 24 && program <= 31) return 'triangle';  // Guitar
    if (program >= 32 && program <= 39) return 'triangle';  // Bass
    if (program >= 40 && program <= 55) return 'sawtooth';  // Strings/Ensemble
    if (program >= 56 && program <= 79) return 'triangle';  // Brass/Reed/Pipe
    if (program >= 80 && program <= 95) return 'square';    // Synth Lead/Pad
    return 'sine';  // Sound effects (96-127)
  }

  async load(): Promise<void> {
    // Synths don't need loading, but interface requires it
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
