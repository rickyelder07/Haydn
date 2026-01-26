import * as Tone from 'tone';

class AudioEngine {
  private static instance: AudioEngine | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Handle browser autoplay policy - must be called from user gesture
    await Tone.start();
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getContext(): Tone.BaseContext {
    return Tone.getContext();
  }
}

export const getAudioEngine = () => AudioEngine.getInstance();
export { AudioEngine };
