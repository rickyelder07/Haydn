# Phase 10: Real Instrument Samples - Research

**Researched:** 2026-02-24
**Domain:** Tone.Sampler + gleitz/midi-js-soundfonts CDN loading
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIO-01 | Piano instruments use percussive envelope (short attack, medium decay) | Replaced by sampled piano — FluidR3 acoustic_grand_piano has natural percussive character |
| AUDIO-02 | String instruments use sustained envelope (long attack, high sustain) | Replaced by sampled strings — FluidR3 violin/cello/etc. have natural attack and sustain |
| AUDIO-03 | Brass instruments use punchy envelope (medium attack, medium sustain) | Replaced by sampled brass — FluidR3 trumpet/trombone/etc. have natural transients |
| AUDIO-04 | All non-percussion instruments have lowpass filter (2-5kHz cutoff) | Not needed with samples — recorded audio already has natural frequency response |
| AUDIO-05 | String instruments include subtle vibrato (4-5Hz frequency, 5-10 cent depth) | Not needed with samples — FluidR3 string samples include natural vibrato |
| AUDIO-06 | Percussion instruments (channel 9) have no vibrato or filtering | Maintained via existing SynthInstrument percussion path (program 999) |
| AUDIO-07 | Instrument sounds are noticeably better than v1.0 (subjective improvement) | Real samples are categorically better than PolySynth — confirmed by user decision |
</phase_requirements>

---

## Summary

Phase 10 replaces `PolySynth`-based synthesis with real recorded GM instrument samples loaded from the gleitz/midi-js-soundfonts CDN. The approach uses `Tone.Sampler` per instrument, which accepts note-to-URL mappings and performs pitch-shifting to fill gaps between sampled notes.

The gleitz CDN serves instrument files as JavaScript objects (`MIDI.Soundfont.[name] = {"C4": "data:audio/mp3;base64,..."}`) rather than direct MP3 URLs. Loading requires: (1) fetch the JS file as text, (2) parse it with a regex/slice approach to extract the note-to-base64 map, (3) pass the base64 data URLs directly to `Tone.Sampler`'s `urls` option. `Tone.Sampler` confirmed to support base64 data URLs (bug was fixed in PR #899).

The core architectural change is creating a new `SamplerInstrument` class that wraps `Tone.Sampler` and fits the existing `InstrumentInstance` interface. `InstrumentFactory.ts` routes all non-percussion programs to `SamplerInstrument` instead of `SynthInstrument`. Loading happens in `NoteScheduler.scheduleNotes()` which is called from `PlaybackController.loadProject()`, which is called from `playbackStore.loadProject()`. The `isLoading` state already exists in `playbackStore` and is already wired to the spinner in `TransportStrip` — extending the load duration to cover sample loading requires no UI changes.

**Primary recommendation:** Use `Tone.Sampler` with gleitz FluidR3_GM base64 data URLs. Fetch the JS file, parse with the `midiJsToJson` approach (find `MIDI.Soundfont.`, slice to `=`, extract JSON body), pass note map to `new Tone.Sampler({ urls: noteMap })`. Keep percussion on existing `SynthInstrument` path. Extend `isLoading: true` duration in `playbackStore` to cover sample loading.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tone` | 15.1.22 (already installed) | `Tone.Sampler` — polyphonic sampler with pitch-shifting | Already in project; native sampler support |
| gleitz/midi-js-soundfonts | CDN (no npm pkg) | 128 GM instruments as base64 MP3 | Canonical web MIDI soundfont source, CDN-only |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Tone.loaded()` | Built into tone | Promise resolving when all audio buffers loaded | Block playback until ready |
| `ToneAudioBuffer.on("progress")` | Built into tone | Track loading progress per-buffer | Progress percentage display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gleitz/FluidR3_GM | gleitz/MusyngKite | MusyngKite is 1.75GB vs 148MB — too large, slower load |
| fetch + parse (manual) | `soundfont-player` npm package | soundfont-player is archived (May 2023), heavy dependency; manual parse is 5 lines |
| base64 data URLs | Direct MP3 URLs | gleitz CDN only provides JS files with base64; no separate MP3 files exist |
| `Tone.Sampler` per-instrument | `Tone.Players` | Sampler auto pitch-shifts between samples; Players does not; Sampler fits the InstrumentInstance interface |

**Installation:**
```bash
# No new npm packages needed — Tone.js already installed
# CDN access is via fetch() at runtime, no install step
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/audio/instruments/
├── InstrumentFactory.ts     # MODIFY: route all non-percussion to SamplerInstrument
├── SamplerInstrument.ts     # NEW: wraps Tone.Sampler, implements InstrumentInstance
├── SynthInstrument.ts       # KEEP UNCHANGED: percussion path (program 999)
├── PianoSampler.ts          # REMOVE or gut: was PolySynth fallback, now unused
├── soundfontLoader.ts       # NEW: fetch + parse CDN JS files -> note:dataURL maps
└── gmInstrumentNames.ts     # NEW: GM program number -> CDN instrument name string
```

### Pattern 1: Gleitz CDN File Format
**What:** Each instrument is a JS file with this structure:
```
if (typeof(MIDI) === 'undefined') var MIDI = {};
if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};
MIDI.Soundfont.acoustic_grand_piano = {
  "A0": "data:audio/mp3;base64,SUQzBAAAAAA...",
  "Bb0": "data:audio/mp3;base64,...",
  ...88 notes total...
}
```
**CDN URL pattern:** `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/{instrument}-mp3.js`
**Example:** `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3.js`
**Instrument name format:** `names.json` array is zero-indexed by GM program number, lowercase underscores.

### Pattern 2: Parsing the Soundfont JS File
**What:** Extract the note-to-base64 map from the JS file text.
**When to use:** After fetching the CDN JS file as text.
**Example:**
```typescript
// Source: soundfont-player/dist/soundfont-player.min.js (midiJsToJson function)
// Verified: HIGH confidence — this is the canonical parsing approach

function parseSoundfontJs(text: string): Record<string, string> {
  const begin = text.indexOf('MIDI.Soundfont.');
  if (begin < 0) throw new Error('Invalid MIDI.js Soundfont format');
  const assignAt = text.indexOf('=', begin) + 2; // skip '= '
  const end = text.lastIndexOf(',');
  return JSON.parse(text.slice(assignAt, end) + '}');
}
// Returns: { "A0": "data:audio/mp3;base64,...", "Bb0": "...", ... }
```

### Pattern 3: SamplerInstrument Class
**What:** Wraps `Tone.Sampler`, implements the existing `InstrumentInstance` interface.
**When to use:** For all non-percussion GM programs.
**Example:**
```typescript
// Source: Tone.js docs https://tonejs.github.io/docs/15.1.22/classes/Sampler.html
// Verified: HIGH confidence

import { Sampler } from 'tone';
import type { InstrumentInstance } from './PianoSampler';

export class SamplerInstrument implements InstrumentInstance {
  private sampler: Sampler | null = null;
  private urls: Record<string, string>;

  constructor(urls: Record<string, string>) {
    this.urls = urls;
  }

  async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sampler = new Sampler({
        urls: this.urls,
        onload: () => resolve(),
        onerror: (err) => reject(err),
      }).toDestination();
    });
  }

  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void {
    const safeDuration = Math.max(duration, 0.05);
    this.sampler?.triggerAttackRelease(note, safeDuration, time, velocity);
  }

  releaseAll(): void {
    this.sampler?.releaseAll();
  }

  dispose(): void {
    this.sampler?.dispose();
    this.sampler = null;
  }
}
```

### Pattern 4: GM Program to CDN Instrument Name Mapping
**What:** Map from GM program number (0–127) to the CDN filename string.
**When to use:** In `soundfontLoader.ts` when building the CDN URL.
**Example:**
```typescript
// Source: https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/names.json
// Verified: HIGH confidence — fetched directly from CDN

// The names.json array IS the mapping — index = GM program number
const GM_SOUNDFONT_NAMES: readonly string[] = [
  "acoustic_grand_piano", "bright_acoustic_piano", "electric_grand_piano",
  "honkytonk_piano", "electric_piano_1", "electric_piano_2", "harpsichord",
  "clavinet", "celesta", "glockenspiel", "music_box", "vibraphone",
  "marimba", "xylophone", "tubular_bells", "dulcimer", "drawbar_organ",
  "percussive_organ", "rock_organ", "church_organ", "reed_organ",
  "accordion", "harmonica", "tango_accordion", "acoustic_guitar_nylon",
  "acoustic_guitar_steel", "electric_guitar_jazz", "electric_guitar_clean",
  "electric_guitar_muted", "overdriven_guitar", "distortion_guitar",
  "guitar_harmonics", "acoustic_bass", "electric_bass_finger",
  "electric_bass_pick", "fretless_bass", "slap_bass_1", "slap_bass_2",
  "synth_bass_1", "synth_bass_2", "violin", "viola", "cello", "contrabass",
  "tremolo_strings", "pizzicato_strings", "orchestral_harp", "timpani",
  "string_ensemble_1", "string_ensemble_2", "synth_strings_1",
  "synth_strings_2", "choir_aahs", "voice_oohs", "synth_choir",
  "orchestra_hit", "trumpet", "trombone", "tuba", "muted_trumpet",
  "french_horn", "brass_section", "synth_brass_1", "synth_brass_2",
  "soprano_sax", "alto_sax", "tenor_sax", "baritone_sax", "oboe",
  "english_horn", "bassoon", "clarinet", "piccolo", "flute", "recorder",
  "pan_flute", "blown_bottle", "shakuhachi", "whistle", "ocarina",
  "lead_1_square", "lead_2_sawtooth", "lead_3_calliope", "lead_4_chiff",
  "lead_5_charang", "lead_6_voice", "lead_7_fifths", "lead_8_bass__lead",
  "pad_1_new_age", "pad_2_warm", "pad_3_polysynth", "pad_4_choir",
  "pad_5_bowed", "pad_6_metallic", "pad_7_halo", "pad_8_sweep",
  "fx_1_rain", "fx_2_soundtrack", "fx_3_crystal", "fx_4_atmosphere",
  "fx_5_brightness", "fx_6_goblins", "fx_7_echoes", "fx_8_scifi",
  "sitar", "banjo", "shamisen", "koto", "kalimba", "bagpipe", "fiddle",
  "shanai", "tinkle_bell", "agogo", "steel_drums", "woodblock",
  "taiko_drum", "melodic_tom", "synth_drum", "reverse_cymbal",
  "guitar_fret_noise", "breath_noise", "seashore", "bird_tweet",
  "telephone_ring", "helicopter", "applause", "gunshot"
];

const CDN_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM';

export function getSoundfontUrl(gmProgram: number): string {
  const name = GM_SOUNDFONT_NAMES[gmProgram];
  if (!name) throw new Error(`Invalid GM program: ${gmProgram}`);
  return `${CDN_BASE}/${name}-mp3.js`;
}
```

### Pattern 5: Loading State Integration
**What:** Extend `isLoading: true` duration in `playbackStore` to cover sample loading.
**When to use:** Samples must be loaded before `isLoading` is set false.
**How it works:**
- `page.tsx` calls `loadProject(project)` on project change
- `playbackStore.loadProject` sets `isLoading: true`, calls `controller.loadProject(project)`
- `controller.loadProject` calls `scheduleNotes(project)`
- `scheduleNotes` calls `createInstrument` per track, which calls `instrument.load()`
- `SamplerInstrument.load()` resolves when `Tone.Sampler` onload fires
- Back in `playbackStore`, `isLoading` is set false after `await controller.loadProject()`
- `TransportStrip` already has `isLoading ? <spinner /> : <PlayIcon />` — no UI changes needed

**Progress tracking (optional enhancement):**
```typescript
// Source: Tone.js docs — ToneAudioBuffer events
// Verified: MEDIUM confidence
import { ToneAudioBuffer } from 'tone';

ToneAudioBuffer.on('progress', (percent: number) => {
  // percent is 0-1
  usePlaybackStore.setState({ loadProgress: percent });
});
```

### Anti-Patterns to Avoid
- **Loading instruments sequentially:** Creates a waterfall — MIDI files can have 10+ unique instruments. Load them in parallel with `Promise.all()`.
- **Fetching per note-trigger:** Never fetch soundfont files on demand at trigger time. All instruments for a project load before playback starts.
- **Using `baseUrl` with base64 data:** Tone.Sampler has a fixed bug (#899) where it prepended `baseUrl` to data URLs. Pass data URLs directly in the `urls` object, omit `baseUrl`, or verify on tone 15.1.22 that this is resolved.
- **Caching within a session:** The same instrument (e.g., program 0 = piano) may appear on multiple tracks. Cache the loaded note map (or the `SamplerInstrument` instance) by program number to avoid re-fetching.
- **Not disposing on project change:** `Sampler` holds WebAudio buffers. Call `dispose()` on project change (already handled by `disposeAllInstruments()` in `NoteScheduler.ts`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pitch shifting between sparse samples | Custom pitch-shifting algorithm | `Tone.Sampler` built-in pitch shifting | Sampler auto-fills gaps — if only C4/F4/A4 are sampled, all other notes are pitch-shifted from nearest |
| Sample decoding | Manual WebAudio `decodeAudioData` | `Tone.Sampler` with data URL | Sampler handles decode internally |
| Loading state aggregation | Custom Promise tracking per buffer | `Tone.loaded()` or `Sampler.onload` | Tone provides built-in aggregate load tracking |
| Soundfont JS parsing | Complex regex | 5-line `parseSoundfontJs()` function from soundfont-player | Proven pattern, handles the exact format |

**Key insight:** `Tone.Sampler` is the right abstraction here — it handles decode, pitch-shift, polyphony, and envelope on samples. The only custom code needed is the CDN fetch + JS parse layer.

---

## Common Pitfalls

### Pitfall 1: Parallel load vs sequential
**What goes wrong:** Loading 10 instruments sequentially takes 10x longer — each instrument JS file is ~200-400KB.
**Why it happens:** `for...of` with `await` in `scheduleNotes` is sequential.
**How to avoid:** Collect all unique instrument programs needed, load them in parallel with `Promise.all()`, then schedule notes.
**Warning signs:** Progress bar stalls for several seconds per instrument instead of advancing smoothly.

### Pitfall 2: Re-fetching identical instruments
**What goes wrong:** A project with 3 piano tracks fetches `acoustic_grand_piano-mp3.js` 3 times.
**Why it happens:** `NoteScheduler` creates an instrument per track, not per program.
**How to avoid:** Use the `loadedInstruments` Map in `NoteScheduler` (already exists as `instrumentKey`) to skip already-loaded instruments. Add a module-level fetch cache (`Map<program, Promise<Record<string,string>>>`) in `soundfontLoader.ts`.
**Warning signs:** Network tab shows duplicate fetches for same soundfont URL.

### Pitfall 3: `baseUrl` prepended to base64 data URLs
**What goes wrong:** `Tone.Sampler` constructs `baseUrl + "data:audio/mp3;base64,..."` → fetch error.
**Why it happens:** Tone's `ToneAudioBuffers` was not skipping data URLs when prepending baseUrl (fixed in PR #899 for older tone versions).
**How to avoid:** Do NOT use `baseUrl` option on the Sampler. Pass the full data URLs directly in the `urls` object. Tone 15.1.22 may have this fixed, but the safest approach is omitting baseUrl entirely.
**Warning signs:** Console error: `GET https://gleitz.github.io/...data:audio/mp3;base64,... 400`.

### Pitfall 4: Loading blocks too early
**What goes wrong:** `isLoading: true` during sample load blocks the entire UI, including instrument selection for tracks.
**Why it happens:** `isLoading` in `playbackStore` drives the play button spinner and disabled state, but it's also used to guard other UI.
**How to avoid:** Check exactly where `isLoading` is used. In this project, it only disables `canInteract` in `TransportStrip` — no other UI gating. So extending `isLoading: true` to cover sample loading is safe.
**Warning signs:** User can't interact with track list or sidebar during sample load.

### Pitfall 5: Silent failure on fetch error
**What goes wrong:** CDN is unavailable (offline, rate-limited, or file missing). Sampler silently plays nothing.
**Why it happens:** No error handling on the fetch or on `Sampler.onerror`.
**How to avoid:** Implement the `onerror` callback on `Tone.Sampler`. Fall back to `SynthInstrument` for that program. Use `projectStore.setError()` to surface the failure to the user.
**Warning signs:** Notes schedule but produce no audio; no console errors surfaced.

### Pitfall 6: Percussion channel plays wrong instrument
**What goes wrong:** Channel 9 tracks (drums) load a melodic soundfont instead of staying on PolySynth.
**Why it happens:** `InstrumentFactory` checks for percussion before routing to `SamplerInstrument`. If the channel check is wrong or `program 999` handling breaks, drums get a melody sample loaded.
**How to avoid:** Keep the existing `isPercussionChannel(channel)` check as the FIRST conditional in `createInstrument`. Return `SynthInstrument(999)` before any CDN loading logic.
**Warning signs:** Drum tracks sound like melodic instruments; CDN fetches for program 999 appear in network tab.

### Pitfall 7: `Tone.Sampler` note name mismatch
**What goes wrong:** Notes don't play because note names don't match what the sampler expects.
**Why it happens:** gleitz soundfonts use scientific notation with flats (`Bb4`). Tone.js uses sharps (`A#4`). The sampler pitch-shifts, so exact key matches matter.
**How to avoid:** `Tone.Sampler` accepts both flat and sharp notation — it normalizes internally. The `midiToNoteName` function in `timeConversion.ts` should be verified to produce Tone-compatible names. No action likely needed.
**Warning signs:** `Tone.Sampler` warning: "No buffer found for note X".

---

## Code Examples

### Complete soundfontLoader.ts
```typescript
// Source: Based on midiJsToJson from soundfont-player (github.com/danigb/soundfont-player)
// Verified: HIGH confidence — parsing logic confirmed from minified source

const CDN_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM';

// Cache to avoid re-fetching same instrument
const fetchCache = new Map<number, Promise<Record<string, string>>>();

export async function loadSoundfontNotes(
  gmProgram: number
): Promise<Record<string, string>> {
  // Return cached promise if already loading/loaded
  const cached = fetchCache.get(gmProgram);
  if (cached) return cached;

  const name = GM_SOUNDFONT_NAMES[gmProgram];
  if (!name) throw new Error(`No soundfont name for GM program ${gmProgram}`);

  const url = `${CDN_BASE}/${name}-mp3.js`;

  const promise = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch soundfont: ${url}`);
      return res.text();
    })
    .then(text => parseSoundfontJs(text));

  fetchCache.set(gmProgram, promise);
  return promise;
}

function parseSoundfontJs(text: string): Record<string, string> {
  // Source: soundfont-player midiJsToJson function
  const begin = text.indexOf('MIDI.Soundfont.');
  if (begin < 0) throw new Error('Invalid MIDI.js Soundfont format');
  const assignAt = text.indexOf('=', begin) + 2;
  const end = text.lastIndexOf(',');
  return JSON.parse(text.slice(assignAt, end) + '}');
}

export function clearSoundfontCache(): void {
  fetchCache.clear();
}
```

### InstrumentFactory.ts update
```typescript
// MODIFY InstrumentFactory.ts — route non-percussion to SamplerInstrument
import { SamplerInstrument } from './SamplerInstrument';
import { SynthInstrument } from './SynthInstrument';
import { isPercussionChannel } from '@/lib/instruments/gm-mapping';
import { loadSoundfontNotes } from './soundfontLoader';
import type { InstrumentInstance } from './PianoSampler';

export async function createInstrument(
  gmProgram: number,
  channel?: number
): Promise<InstrumentInstance> {
  // Percussion stays on SynthInstrument (program 999 special code)
  if (channel !== undefined && isPercussionChannel(channel)) {
    const instrument = new SynthInstrument(999);
    await instrument.load();
    return instrument;
  }

  // All melodic instruments: load real samples
  try {
    const urls = await loadSoundfontNotes(gmProgram);
    const instrument = new SamplerInstrument(urls);
    await instrument.load();
    return instrument;
  } catch (err) {
    // Fallback to SynthInstrument if CDN fails
    console.warn(`Soundfont load failed for program ${gmProgram}, using synth fallback:`, err);
    const instrument = new SynthInstrument(gmProgram);
    await instrument.load();
    return instrument;
  }
}
```

### Parallel loading in NoteScheduler
```typescript
// MODIFY scheduleNotes() to collect unique instruments, load in parallel
// Existing logic in NoteScheduler.ts already caches by instrumentKey —
// the parallel loading happens by pre-computing all unique programs upfront

async function preloadInstruments(project: HaydnProject): Promise<void> {
  const { ppq, tempos } = project.metadata;
  const uniqueInstruments: Array<{ key: number | string; gmProgram: number; channel: number }> = [];

  for (const track of project.tracks) {
    if (track.notes.length === 0) continue;
    const isPercussion = isPercussionChannel(track.channel);
    const instrumentKey = isPercussion ? 'percussion' : track.instrumentNumber;
    if (!loadedInstruments.has(instrumentKey)) {
      uniqueInstruments.push({
        key: instrumentKey,
        gmProgram: track.instrumentNumber,
        channel: track.channel
      });
    }
  }

  // Load all unique instruments in parallel
  await Promise.all(
    uniqueInstruments.map(async ({ key, gmProgram, channel }) => {
      const instrument = await createInstrument(gmProgram, channel);
      loadedInstruments.set(key, instrument);
    })
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `PianoSampler.ts` (PolySynth) | `SamplerInstrument` (Tone.Sampler + CDN) | Phase 10 | All melodic instruments use real recordings |
| `SynthInstrument` for all non-piano | `SamplerInstrument` for all non-percussion | Phase 10 | 127 programs use recorded samples instead of oscillators |
| Instant load (synth has no load time) | Async CDN load (100-400ms per instrument) | Phase 10 | `isLoading` must cover sample loading |
| `PIANO_PROGRAMS` special-case in `InstrumentFactory` | No special-cases (all programs → CDN, percussion → synth) | Phase 10 | Simpler routing |

**Deprecated/outdated:**
- `PianoSampler.ts`: Was a workaround ("CDN loading issues"). Now replaced. Can be removed or gutted (keep the `InstrumentInstance` interface export).
- Per-instrument envelope tuning (`SynthInstrument.getEnvelopeForProgram`): Irrelevant for samples. Percussion path still uses this.
- `PIANO_PROGRAMS` array in `InstrumentFactory.ts`: Remove — all programs route to CDN now.

---

## Open Questions

1. **Load time for multi-instrument projects**
   - What we know: Each soundfont JS file is ~200-400KB (base64 MP3). A project with 8 unique instruments = 8 fetches.
   - What's unclear: Actual load time on a typical connection. Network tab would confirm.
   - Recommendation: Implement parallel loading (Pattern 5 above). Accept that load takes a few seconds on first use.

2. **Tone.Sampler base64 + tone 15.1.22**
   - What we know: Bug #899 was fixed in a PR (specific version unknown). Tone 15.1.22 is installed.
   - What's unclear: Whether 15.1.22 has the fix. The issue was from an older version.
   - Recommendation: During implementation, test by loading one instrument and checking if any network error occurs with `data:audio/mp3;base64,...` URLs. If error occurs, omit `baseUrl` (already the pattern in Pattern 3).

3. **CDN reliability / CORS**
   - What we know: gleitz CDN is GitHub Pages. CORS should allow cross-origin fetch.
   - What's unclear: Whether GitHub Pages has CORS headers set for `*.js` files.
   - Recommendation: Test fetch in browser during Wave 1. If CORS fails, use `mode: 'no-cors'` or proxy — but GitHub Pages typically allows CORS for static files.

4. **Progress bar granularity**
   - What we know: `ToneAudioBuffer.on('progress')` fires during loading.
   - What's unclear: Whether the event provides meaningful per-instrument progress or only global.
   - Recommendation: Start with simple spinner (already exists in `TransportStrip`). Add percentage only if timing feels too long.

---

## Current Codebase State (Integration Points)

### Files to MODIFY
| File | Change |
|------|--------|
| `src/audio/instruments/InstrumentFactory.ts` | Route all non-percussion to `SamplerInstrument`; remove `PIANO_PROGRAMS` |
| `src/audio/playback/NoteScheduler.ts` | Add parallel pre-load of unique instruments before scheduling |

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/audio/instruments/SamplerInstrument.ts` | `Tone.Sampler` wrapper implementing `InstrumentInstance` |
| `src/audio/instruments/soundfontLoader.ts` | CDN fetch + JS parse + cache for gleitz soundfonts |
| `src/audio/instruments/gmInstrumentNames.ts` | 128-entry array mapping GM program → CDN filename |

### Files to REMOVE/CLEAN
| File | Action |
|------|--------|
| `src/audio/instruments/PianoSampler.ts` | Keep file but gut to only export `InstrumentInstance` interface (other files import from it) |

### No changes needed
| File | Reason |
|------|--------|
| `src/audio/instruments/SynthInstrument.ts` | Percussion (program 999) still uses this unchanged |
| `src/audio/playback/PlaybackController.ts` | `loadProject` already awaits `scheduleNotes` — sample loading is transparent |
| `src/state/playbackStore.ts` | `isLoading: true` already set during `loadProject`, false after. Sample loading happens inside that window |
| `src/components/TimelineRuler/TransportStrip.tsx` | Already shows spinner when `isLoading: true` |
| `src/audio/AudioEngine.ts` | No changes needed |

---

## Sources

### Primary (HIGH confidence)
- gleitz/midi-js-soundfonts GitHub Pages — CDN URL structure, file format, names.json
- Tone.js docs 15.1.22 `Sampler` class — constructor, `urls`, `onload`, `loaded` property, `triggerAttackRelease`
- soundfont-player (danigb) minified source — `midiJsToJson` parsing algorithm
- Tone.js GitHub issue #898 / PR #899 — base64 data URL support confirmed fixed

### Secondary (MEDIUM confidence)
- Tone.js WebSearch + official docs — `Tone.loaded()`, `ToneAudioBuffer.on('progress')`
- gleitz names.json fetched directly — complete 128-name array confirmed

### Tertiary (LOW confidence)
- gleitz CDN CORS behavior — assumed standard GitHub Pages behavior, not explicitly tested

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tone.Sampler and gleitz CDN both verified from official sources
- Architecture: HIGH — All integration points traced through actual source code
- Pitfalls: HIGH — Most derived from actual code inspection + verified Tone.js issues
- CDN parsing: HIGH — `midiJsToJson` algorithm confirmed from soundfont-player source

**Research date:** 2026-02-24
**Valid until:** 2026-05-24 (gleitz CDN is stable; Tone.js 15.x is mature)
