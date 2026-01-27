import { PianoSampler, type InstrumentInstance } from './PianoSampler';
import { SynthInstrument } from './SynthInstrument';
import { isPercussionChannel } from '@/lib/instruments/gm-mapping';

// Piano GM programs (0-7: Acoustic Grand Piano through Clavinet)
const PIANO_PROGRAMS = [0, 1, 2, 3, 4, 5, 6, 7];

export async function createInstrument(
  gmProgram: number,
  channel?: number
): Promise<InstrumentInstance> {
  // Check if percussion (channel 9)
  const isPercussion = channel !== undefined && isPercussionChannel(channel);

  if (isPercussion) {
    // Use percussion-specific instrument (short, punchy envelope)
    const instrument = new SynthInstrument(999); // Special code for percussion
    await instrument.load();
    return instrument;
  }

  const isPiano = PIANO_PROGRAMS.includes(gmProgram);

  const instrument = isPiano
    ? new PianoSampler()
    : new SynthInstrument(gmProgram);

  await instrument.load();
  return instrument;
}

export type { InstrumentInstance };
