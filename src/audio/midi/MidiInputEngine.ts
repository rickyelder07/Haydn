// Inline Web MIDI API type declarations.
// Do NOT install @types/webmidi — it conflicts with tsconfig lib settings.
// These minimal declarations cover everything MidiInputEngine needs.
interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((event: Event) => void) | null;
}

interface MIDIInput {
  name?: string;
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIConnectionEvent extends Event {
  port: { type: string; state: string; name?: string };
}

export interface MIDIMessageEvent extends Event {
  data: Uint8Array;
  timeStamp: number;
}

class MidiInputEngine {
  private midiAccess: MIDIAccess | null = null;
  private messageHandlers: Set<(event: MIDIMessageEvent) => void> = new Set();

  // ---------- SSR / browser support guard ----------

  isWebMidiSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof (navigator as unknown as Record<string, unknown>)['requestMIDIAccess'] !== 'undefined'
    );
  }

  // ---------- Access request ----------

  async requestAccess(): Promise<void> {
    if (!this.isWebMidiSupported()) {
      throw new Error(
        'Web MIDI API is not supported. Please use Chrome, Edge, or Opera.'
      );
    }

    try {
      // navigator.requestMIDIAccess is not typed in the default TS lib,
      // so we reach through the record interface.
      const requestMIDIAccess = (
        navigator as unknown as {
          requestMIDIAccess: (options: { sysex: boolean }) => Promise<MIDIAccess>;
        }
      ).requestMIDIAccess;

      this.midiAccess = await requestMIDIAccess.call(navigator, { sysex: false });
      this.attachInputListeners();
      this.midiAccess.onstatechange = (event: Event) =>
        this.handleStateChange(event as MIDIConnectionEvent);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        throw new Error(
          'MIDI access denied. Please allow MIDI access in your browser settings.'
        );
      }
      throw err;
    }
  }

  // ---------- Input listeners ----------

  private attachInputListeners(): void {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input: MIDIInput) => {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        this.messageHandlers.forEach((handler) => handler(event));
      };
    });
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    // Re-attach listeners after hot-plug/unplug so new devices get handlers.
    this.attachInputListeners();

    // Update the Zustand store device list. Late binding (called inside callback,
    // not at module load) resolves the circular import with midiInputStore.
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid circular-dep at module evaluation time.
      import('@/state/midiInputStore').then(({ getMidiInputStore }) => {
        getMidiInputStore().getState().refreshDevices(this.midiAccess);
      });
    }

    void event; // suppress unused-variable lint
  }

  // ---------- Device list ----------

  getInputDevices(): string[] {
    if (!this.midiAccess) return [];
    return Array.from(this.midiAccess.inputs.values()).map(
      (input: MIDIInput) => input.name ?? 'Unknown Device'
    );
  }

  // ---------- Message handler registry ----------

  addMessageHandler(
    handler: (event: MIDIMessageEvent) => void
  ): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  // ---------- Cleanup ----------

  dispose(): void {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input: MIDIInput) => {
        input.onmidimessage = null;
      });
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.messageHandlers.clear();
  }
}

// Module-level singleton — matches AudioEngine pattern.
let instance: MidiInputEngine | null = null;

export function getMidiInputEngine(): MidiInputEngine {
  if (!instance) instance = new MidiInputEngine();
  return instance;
}

export { MidiInputEngine };
