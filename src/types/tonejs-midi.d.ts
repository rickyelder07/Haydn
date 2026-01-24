declare module '@tonejs/midi' {
  // Minimal type declarations for @tonejs/midi
  export class Midi {
    constructor(arrayBuffer?: ArrayBuffer);
    header: {
      name: string;
      ppq: number;
      tempos: Array<{ ticks: number; bpm: number }>;
      timeSignatures: Array<{ ticks: number; timeSignature: [number, number] }>;
      keySignatures: Array<{ ticks: number; key: string; scale: string }>;
      setTempo(bpm: number, ticks?: number): void;
    };
    tracks: Track[];
    duration: number;
    addTrack(): Track;
    toArray(): Uint8Array;
  }

  export interface Track {
    name: string;
    channel: number;
    instrument: { name: string; number: number } | null;
    notes: Array<{
      midi: number;
      ticks: number;
      durationTicks: number;
      velocity: number;
      time: number;
      duration: number;
    }>;
    controlChanges: Record<number, Array<{ ticks: number; value: number }>>;
    addNote(options: {
      midi: number;
      ticks?: number;
      time?: number;
      durationTicks?: number;
      duration?: number;
      velocity?: number;
    }): void;
    addCC(options: { number: number; value: number; ticks: number }): void;
  }
}
