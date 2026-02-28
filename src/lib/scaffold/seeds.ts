/**
 * Stylistic seed vocabulary for AI Compose scaffold prompt injection.
 *
 * Seeds are randomly picked at request time and injected into the Claude
 * system prompt to encourage variety and unexpectedness in generated output.
 */

export const STYLISTIC_SEED_VOCABULARY = [
  'modal interchange',
  'pedal point under moving harmony',
  'chromatic mediant shift',
  'deceptive cadence to vi',
  'Neapolitan chord (bII)',
  'secondary dominant chain (V/V/V)',
  'borrowed iv chord in major',
  'lydian #4 color note',
  'half-diminished bridge chord',
  'tritone substitution on V7',
  'extended jazz voicings (9th, 11th, 13th)',
  'sus2 → sus4 → resolved motion',
  'cliché descending bass line (I – I/vii – vi – V)',
  'Andalusian cadence (i – VII – VI – V)',
  'pivot chord modulation to relative major/minor',
  'polyrhythmic cross-rhythm feel',
] as const;

/**
 * Fisher-Yates shuffle + slice — pick n distinct seeds randomly.
 * Does not mutate the source array.
 */
export function pickSeeds(n = 3): string[] {
  const pool = [...STYLISTIC_SEED_VOCABULARY];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
