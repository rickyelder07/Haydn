import { SamplerInstrument } from './SamplerInstrument';
import { SynthInstrument } from './SynthInstrument';
import { isPercussionChannel } from '@/lib/instruments/gm-mapping';
import { loadSoundfontNotes } from './soundfontLoader';
import type { InstrumentInstance } from './PianoSampler';

export async function createInstrument(
  gmProgram: number,
  channel?: number
): Promise<InstrumentInstance> {
  // Check if percussion (channel 9) FIRST — no CDN loading for percussion
  const isPercussion = channel !== undefined && isPercussionChannel(channel);

  if (isPercussion) {
    // Use percussion-specific instrument (short, punchy envelope)
    const instrument = new SynthInstrument(999); // Special code for percussion
    await instrument.load();
    return instrument;
  }

  // All non-percussion GM programs use CDN soundfont samples
  try {
    const urls = await loadSoundfontNotes(gmProgram);
    const instrument = new SamplerInstrument(urls);
    await instrument.load();
    return instrument;
  } catch (err) {
    console.warn(`Soundfont load failed for program ${gmProgram}, using synth fallback:`, err);
    const instrument = new SynthInstrument(gmProgram);
    await instrument.load();
    return instrument;
  }
}

export type { InstrumentInstance };
