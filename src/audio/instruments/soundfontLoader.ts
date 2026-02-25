import { getSoundfontUrl } from './gmInstrumentNames';

// Module-level cache to deduplicate concurrent and repeated fetches for the same program.
// Stores the Promise itself so parallel callers share the same in-flight request.
const fetchCache = new Map<number, Promise<Record<string, string>>>();

export async function loadSoundfontNotes(
  gmProgram: number
): Promise<Record<string, string>> {
  // Return cached promise if already loading or loaded
  const cached = fetchCache.get(gmProgram);
  if (cached) return cached;

  const url = getSoundfontUrl(gmProgram);

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch soundfont: ${url}`);
      return res.text();
    })
    .then((text) => parseSoundfontJs(text));

  fetchCache.set(gmProgram, promise);
  return promise;
}

// Parses the gleitz MIDI.js soundfont JS file format into a note-to-dataURL map.
// Source: midiJsToJson from soundfont-player (danigb) — canonical parsing approach.
function parseSoundfontJs(text: string): Record<string, string> {
  const begin = text.indexOf('MIDI.Soundfont.');
  if (begin < 0) throw new Error('Invalid MIDI.js Soundfont format');
  const assignAt = text.indexOf('=', begin) + 2; // skip '= '
  const end = text.lastIndexOf(',');
  return JSON.parse(text.slice(assignAt, end) + '}');
}

export function clearSoundfontCache(): void {
  fetchCache.clear();
}
