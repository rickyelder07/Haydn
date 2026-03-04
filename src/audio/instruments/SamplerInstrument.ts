import { Sampler } from 'tone';
import type { InstrumentInstance } from './PianoSampler';

export class SamplerInstrument implements InstrumentInstance {
  private sampler: Sampler | null = null;
  private urls: Record<string, string>;

  constructor(urls: Record<string, string>) {
    this.urls = urls;
  }

  async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Do NOT pass baseUrl — Tone.Sampler bug #899 where baseUrl was prepended
      // to data: URLs. Pass all data URLs directly in urls to avoid this.
      this.sampler = new Sampler({
        urls: this.urls,
        onload: () => resolve(),
        onerror: (err) => reject(err),
      }).toDestination();
    });
  }

  triggerAttackRelease(
    note: string,
    duration: number,
    time: number,
    velocity: number
  ): void {
    const safeDuration = Math.max(duration, 0.05);
    this.sampler?.triggerAttackRelease(note, safeDuration, time, velocity);
  }

  triggerAttack(note: string, time: number, velocity: number): void {
    this.sampler?.triggerAttack(note, time, velocity);
  }

  triggerRelease(note: string, time: number): void {
    this.sampler?.triggerRelease(note, time);
  }

  releaseAll(): void {
    this.sampler?.releaseAll();
  }

  dispose(): void {
    this.sampler?.dispose();
    this.sampler = null;
  }
}
