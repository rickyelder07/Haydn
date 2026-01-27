import { PolySynth, Synth } from 'tone';
import type { InstrumentInstance } from './PianoSampler';

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface EnvelopeSettings {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export class SynthInstrument implements InstrumentInstance {
  private synth: PolySynth;

  constructor(gmProgram: number) {
    const waveform = this.getWaveformForProgram(gmProgram);
    const envelope = this.getEnvelopeForProgram(gmProgram);

    this.synth = new PolySynth(Synth, {
      oscillator: { type: waveform },
      envelope
    }).toDestination();

    // Adjust volume based on instrument type
    this.synth.volume.value = this.getVolumeForProgram(gmProgram);
  }

  private getWaveformForProgram(program: number): OscillatorType {
    // GM program mapping - distinct waveforms per category
    if (program >= 0 && program <= 7) return 'triangle';    // Piano/Chromatic
    if (program >= 8 && program <= 15) return 'sine';       // Percussion
    if (program >= 16 && program <= 23) return 'square';    // Organ
    if (program >= 24 && program <= 31) return 'triangle';  // Guitar
    if (program >= 32 && program <= 39) return 'sawtooth';  // Bass
    if (program >= 40 && program <= 55) return 'sawtooth';  // Strings/Ensemble
    if (program >= 56 && program <= 79) return 'square';    // Brass/Reed/Pipe
    if (program >= 80 && program <= 95) return 'square';    // Synth Lead/Pad
    return 'sine';  // Sound effects (96-127)
  }

  private getEnvelopeForProgram(program: number): EnvelopeSettings {
    // Distinct envelopes for different instrument families
    if (program >= 0 && program <= 7) {
      // Piano: fast attack, moderate decay/sustain, long release
      return { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1.5 };
    }
    if (program >= 8 && program <= 15) {
      // Percussion: instant attack, quick decay, no sustain
      return { attack: 0.001, decay: 0.15, sustain: 0, release: 0.3 };
    }
    if (program >= 16 && program <= 23) {
      // Organ: no attack/decay, full sustain (organ-like)
      return { attack: 0.01, decay: 0, sustain: 1.0, release: 0.2 };
    }
    if (program >= 24 && program <= 31) {
      // Guitar: quick attack, moderate decay/sustain
      return { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 };
    }
    if (program >= 32 && program <= 39) {
      // Bass: quick attack, strong sustain
      return { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.5 };
    }
    if (program >= 40 && program <= 55) {
      // Strings: slow attack (bow), long sustain/release
      return { attack: 0.15, decay: 0.3, sustain: 0.8, release: 1.2 };
    }
    if (program >= 56 && program <= 79) {
      // Brass: moderate attack, strong sustain
      return { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.4 };
    }
    if (program >= 80 && program <= 95) {
      // Synth: varied, use pad-like settings
      return { attack: 0.1, decay: 0.3, sustain: 0.6, release: 1.0 };
    }
    // Default
    return { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1.0 };
  }

  private getVolumeForProgram(program: number): number {
    // Adjust volume for different instrument types
    if (program >= 8 && program <= 15) return -6;  // Percussion quieter
    if (program >= 32 && program <= 39) return 0;  // Bass at normal
    if (program >= 40 && program <= 55) return -3; // Strings slightly quieter
    return -3; // Default slightly quieter
  }

  async load(): Promise<void> {
    // Synths don't need loading, but interface requires it
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
