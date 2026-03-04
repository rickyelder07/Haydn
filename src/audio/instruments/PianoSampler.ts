export interface InstrumentInstance {
  load(): Promise<void>;
  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void;
  releaseAll(): void;
  dispose(): void;
  // Live MIDI playing (optional — not all instruments support it)
  triggerAttack?(note: string, time: number, velocity: number): void;
  triggerRelease?(note: string, time: number): void;
}
