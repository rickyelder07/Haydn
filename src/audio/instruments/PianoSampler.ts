import { Piano } from '@tonejs/piano';

export interface InstrumentInstance {
  load(): Promise<void>;
  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void;
  releaseAll(): void;
  dispose(): void;
}

export class PianoSampler implements InstrumentInstance {
  private piano: Piano;
  private loaded = false;

  constructor() {
    // Use 5 velocity levels (smaller download) per RESEARCH.md
    this.piano = new Piano({ velocities: 5 }).toDestination();
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    await this.piano.load();
    this.loaded = true;
  }

  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void {
    this.piano.keyDown({ note, time, velocity });
    this.piano.keyUp({ note, time: time + duration });
  }

  releaseAll(): void {
    this.piano.stopAll();
  }

  dispose(): void {
    this.piano.dispose();
  }
}
