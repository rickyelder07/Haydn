import { PianoSampler, type InstrumentInstance } from './PianoSampler';
import { SynthInstrument } from './SynthInstrument';

// Piano GM programs (0-7: Acoustic Grand Piano through Clavinet)
const PIANO_PROGRAMS = [0, 1, 2, 3, 4, 5, 6, 7];

export async function createInstrument(gmProgram: number): Promise<InstrumentInstance> {
  const isPiano = PIANO_PROGRAMS.includes(gmProgram);

  const instrument = isPiano
    ? new PianoSampler()
    : new SynthInstrument(gmProgram);

  await instrument.load();
  return instrument;
}

export type { InstrumentInstance };
