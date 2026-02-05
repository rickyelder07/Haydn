# Phase 6: Natural Language Generation - Research

**Researched:** 2026-02-05
**Domain:** AI-powered MIDI generation from natural language prompts
**Confidence:** MEDIUM

## Summary

Natural language MIDI generation transforms text descriptions into complete musical compositions. Research reveals that successful generation requires a three-layer approach: (1) prompt parsing to extract musical parameters (tempo, key, genre), (2) rule-based composition using music theory to create coherent structures, and (3) LLM-guided refinement for stylistic coherence.

The standard approach separates concerns: LLMs excel at understanding user intent and mapping text to musical parameters, but rule-based algorithms (chord progressions, rhythm patterns, melodic contours) produce more musically coherent results than end-to-end neural generation. Recent research (MIDI-GPT, M6(GPT)3) demonstrates that hybrid systems combining GPT prompt parsing with algorithmic composition outperform pure neural approaches.

For Haydn specifically, the existing Phase 5 infrastructure (OpenAI structured outputs, Zod schemas, music theory validation, Tonal.js) can be extended to generation. The key difference: editing provides existing MIDI context as constraints, while generation must synthesize all constraints (key, tempo, structure, genre conventions) from a text prompt and empty canvas.

**Primary recommendation:** Use GPT-4o to parse generation prompts into structured musical parameters (key, tempo, time signature, genre, structure, emotion), then apply rule-based algorithms to generate MIDI notes that conform to music theory and genre conventions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenAI SDK | 6.17.0 | Structured prompt parsing with Zod schemas | Already integrated, supports response_format for guaranteed JSON structure |
| Tonal.js | 6.4.3 | Music theory operations (scales, chords, progressions) | Already integrated, comprehensive music theory library with chord progression support |
| Zod | 4.3.6 | Schema validation for generation parameters | Already integrated, ensures type-safe LLM outputs |
| @tonejs/midi | 2.0.28 | MIDI file construction | Already integrated, standard for JavaScript MIDI manipulation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| js-tiktoken | 1.0.21 | Token counting for cost estimation | Already integrated, calculate generation prompt costs |
| Tonal @tonaljs/progression | (part of 6.4.3) | Chord progression utilities | Building progression sequences from roman numerals |
| Tonal @tonaljs/chord-detect | (part of 6.4.3) | Chord identification | Validating generated chord progressions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Rule-based composition | End-to-end neural MIDI generation (MusicLM, MusicGen) | Neural models generate audio (not MIDI), require massive compute, lack controllability, produce less theory-coherent results |
| GPT-4o for parsing | GPT-4 Turbo | Structured outputs only available in gpt-4o-2024-08-06 and newer, required for guaranteed schema compliance |
| Tonal.js | Custom music theory implementation | Tonal is battle-tested, comprehensive, well-documented; custom implementation risks theory errors |

**Installation:**
```bash
# No new dependencies required - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── nl-generation/           # NEW: Generation-specific logic
│   │   ├── promptParser.ts      # Parse NL prompt -> GenerationParams
│   │   ├── structureGenerator.ts # Generate song structure (intro, verse, chorus)
│   │   ├── chordGenerator.ts    # Generate chord progressions for sections
│   │   ├── rhythmGenerator.ts   # Generate genre-appropriate drum patterns
│   │   ├── melodyGenerator.ts   # Generate melodic lines over chords
│   │   ├── bassGenerator.ts     # Generate bass lines following chord roots
│   │   └── midiAssembler.ts     # Assemble all parts into HaydnProject
│   ├── openai/                   # EXISTING: OpenAI integration
│   │   ├── schemas.ts           # ADD: GenerationParamsSchema
│   │   └── client.ts            # REUSE: Existing OpenAI client
│   └── music-theory/            # EXISTING: Theory validation
│       ├── types.ts             # REUSE: Existing genre rules
│       └── rules/genres.ts      # REUSE: Genre-specific constraints
├── app/api/
│   └── nl-generate/             # NEW: Generation API endpoint
│       └── route.ts             # POST endpoint for generation
└── state/
    └── nlGenerationStore.ts     # NEW: Zustand store for generation state
```

### Pattern 1: Prompt Parsing (LLM-Powered Parameter Extraction)
**What:** Use GPT-4o to extract structured musical parameters from natural language prompts
**When to use:** First step of every generation request
**Example:**
```typescript
// Zod schema for generation parameters
const GenerationParamsSchema = z.object({
  genre: z.enum(['lofi', 'trap', 'boom-bap', 'jazz', 'classical', 'pop']),
  tempo: z.number().min(40).max(200).describe('BPM'),
  key: z.string().describe('Musical key like "C", "D#", "Bb"'),
  scale: z.enum(['major', 'minor', 'harmonic minor', 'dorian', 'mixolydian']),
  timeSignatureNumerator: z.number().int().min(2).max(16),
  timeSignatureDenominator: z.number().int().min(2).max(16),
  structure: z.array(z.object({
    section: z.enum(['intro', 'verse', 'chorus', 'bridge', 'outro']),
    bars: z.number().int().min(1).max(64)
  })),
  emotion: z.object({
    valence: z.number().min(-1).max(1).describe('Happy(1) to sad(-1)'),
    arousal: z.number().min(-1).max(1).describe('Energetic(1) to calm(-1)')
  }),
  instrumentation: z.array(z.object({
    role: z.enum(['drums', 'bass', 'melody', 'chords', 'harmony']),
    instrument: z.number().int().min(0).max(127).describe('GM instrument number')
  })),
  description: z.string().describe('Original user prompt for reference')
});

// System prompt instructs GPT to fill in reasonable defaults for unspecified parameters
const systemPrompt = `You are a music generation parameter extractor. Parse the user's prompt and output structured generation parameters. If the user doesn't specify a parameter, infer a reasonable default based on the genre.

Genre defaults:
- lofi: 70-90 BPM, minor scales, 4/4 time, chill emotion (low arousal)
- trap: 140-160 BPM, minor scales, 4/4 time, dark emotion (high arousal)
- boom-bap: 85-95 BPM, minor scales, 4/4 time, laid-back emotion
- jazz: 120-180 BPM, dorian/mixolydian, 4/4 time, sophisticated emotion
- classical: 60-120 BPM, major/minor, varies, varies by movement
- pop: 100-130 BPM, major scales, 4/4 time, uplifting emotion

If structure is not specified, default to: intro(4 bars), verse(8 bars), chorus(8 bars), verse(8 bars), chorus(8 bars), outro(4 bars).`;
```

### Pattern 2: Rule-Based Chord Progression (Music Theory Algorithms)
**What:** Generate chord progressions using music theory rules, not LLM generation
**When to use:** For every section in the structure (verse, chorus, etc.)
**Example:**
```typescript
// Source: Research on M6(GPT)3 approach (arxiv.org/html/2409.12638v1)
// Chord progressions follow circle of fifths and functional harmony rules

interface ChordProgressionRules {
  genre: string;
  commonProgressions: string[][]; // Roman numerals
  allowedTransitions: Map<string, string[]>; // Which chords can follow others
}

const LOFI_RULES: ChordProgressionRules = {
  genre: 'lofi',
  // Common lo-fi progressions use jazzy extensions
  commonProgressions: [
    ['imaj7', 'IVmaj7', 'v7', 'imaj7'],     // i-IV-v-i with maj7
    ['imaj7', 'VImaj7', 'iimaj7', 'Vmaj7'], // i-VI-ii-V
    ['imaj7', 'IVmaj7', 'VImaj7', 'Vmaj7'], // i-IV-VI-V
  ],
  allowedTransitions: new Map([
    ['i', ['IV', 'VI', 'ii', 'V']],
    ['IV', ['V', 'i', 'VI']],
    ['V', ['i']],
    ['VI', ['ii', 'V', 'IV']],
    ['ii', ['V', 'i']],
  ])
};

function generateChordProgression(
  params: GenerationParams,
  sectionType: string,
  bars: number
): Chord[] {
  // Use Tonal.js Progression module
  const { Progression, Key } = require('tonal');

  // Get genre-specific rules
  const rules = getGenreRules(params.genre);

  // Select progression template based on section type
  let progression: string[];
  if (sectionType === 'verse') {
    progression = rules.commonProgressions[0]; // More stable
  } else if (sectionType === 'chorus') {
    progression = rules.commonProgressions[1]; // More dynamic
  } else {
    progression = rules.commonProgressions[0];
  }

  // Convert roman numerals to actual chords in the key
  const chords = Progression.fromRomanNumerals(params.key, progression);

  // Repeat/extend progression to fill bars
  const extendedChords = repeatToLength(chords, bars);

  return extendedChords.map(name => Chord.get(name));
}
```

### Pattern 3: Rhythm Pattern Templates (Genre-Specific Drum Programming)
**What:** Use hard-coded rhythm templates for genre-appropriate drum patterns
**When to use:** Generating percussion tracks
**Example:**
```typescript
// Source: Research on genre drum patterns (midimighty.com, slimegreenbeats.com)

interface DrumPattern {
  kick: number[];      // Tick positions for kick drum
  snare: number[];     // Tick positions for snare
  hihat: number[];     // Tick positions for hi-hat
  ghost: number[];     // Tick positions for ghost notes (low velocity)
}

const TRAP_PATTERNS: DrumPattern[] = [
  {
    // Pattern 1: Classic trap with hi-hat rolls
    kick: [0, 480, 960, 1440, 1680], // Snare on 3rd and 7th (16th grid)
    snare: [480, 1440],
    hihat: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800], // 16th notes
    ghost: [600, 1080, 1560] // Ghost notes between kicks
  }
];

const LOFI_PATTERNS: DrumPattern[] = [
  {
    // Pattern 1: Sparse boom-bap style
    kick: [0, 960],      // Kicks on 1 and 3
    snare: [480, 1440],  // Snares on 2 and 4
    hihat: [0, 480, 960, 1440], // Quarter note hi-hats (sparse)
    ghost: []
  }
];

function generateDrumTrack(
  params: GenerationParams,
  structure: Structure[],
  ppq: number
): HaydnNote[] {
  const patterns = getGenreDrumPatterns(params.genre);
  const notes: HaydnNote[] = [];
  let currentTick = 0;

  for (const section of structure) {
    const pattern = selectPatternForSection(patterns, section.section);
    const barsInTicks = section.bars * 4 * ppq; // bars * beats * ppq

    // Repeat pattern for duration of section
    for (let bar = 0; bar < section.bars; bar++) {
      const barStart = currentTick + (bar * 4 * ppq);

      // Add kicks
      for (const tick of pattern.kick) {
        notes.push({
          midi: 36, // GM kick drum
          ticks: barStart + tick,
          durationTicks: ppq / 4, // 16th note
          velocity: 0.9
        });
      }

      // Add snares
      for (const tick of pattern.snare) {
        notes.push({
          midi: 38, // GM snare
          ticks: barStart + tick,
          durationTicks: ppq / 4,
          velocity: 0.85
        });
      }

      // Add hi-hats
      for (const tick of pattern.hihat) {
        notes.push({
          midi: 42, // GM closed hi-hat
          ticks: barStart + tick,
          durationTicks: ppq / 8,
          velocity: 0.6
        });
      }
    }

    currentTick += barsInTicks;
  }

  return notes;
}
```

### Pattern 4: Melody Generation (Genetic Algorithm or Weighted Random Walk)
**What:** Generate melodic lines that follow chord tones and scale degrees
**When to use:** Creating melody, harmony, and motif tracks
**Example:**
```typescript
// Source: Research on M6(GPT)3 genetic algorithm approach (arxiv.org/html/2409.12638v1)

interface MelodyConstraints {
  scale: number[];         // Pitch classes in scale (0-11)
  chordTones: number[];    // Pitch classes of current chord
  range: [number, number]; // [minMidi, maxMidi]
  noteDensity: number;     // Notes per bar (0-16)
  stepwiseRatio: number;   // Percentage of stepwise motion (0-1)
}

function generateMelodicLine(
  chords: Chord[],
  params: GenerationParams,
  ppq: number,
  bars: number
): HaydnNote[] {
  const notes: HaydnNote[] = [];
  const scale = getScalePitchClasses(params.key, params.scale);

  // Start on tonic
  let currentMidi = Note.midi(params.key + '4'); // Start in octave 4

  for (let bar = 0; bar < bars; bar++) {
    const chordIndex = bar % chords.length;
    const chord = chords[chordIndex];
    const chordTones = Chord.get(chord.symbol).notes.map(n => Note.chroma(n));

    const barStart = bar * 4 * ppq;
    const notesPerBar = Math.floor(params.emotion.arousal * 8 + 4); // 4-12 notes based on energy

    for (let i = 0; i < notesPerBar; i++) {
      const tickOffset = (i * 4 * ppq) / notesPerBar;
      const ticks = barStart + tickOffset;

      // Choose next note using weighted probabilities
      const nextMidi = chooseNextNote(currentMidi, chordTones, scale, params);

      notes.push({
        midi: nextMidi,
        ticks,
        durationTicks: ppq, // Quarter note default
        velocity: 0.7 + Math.random() * 0.2 // Slight velocity variation
      });

      currentMidi = nextMidi;
    }
  }

  return notes;
}

function chooseNextNote(
  currentMidi: number,
  chordTones: number[],
  scale: Set<number>,
  params: GenerationParams
): number {
  const currentPitchClass = currentMidi % 12;

  // Weighted probabilities:
  // - 60% chord tones (strong beats)
  // - 30% other scale tones
  // - 10% chromatic passing tones

  const rand = Math.random();
  let targetPitchClass: number;

  if (rand < 0.6) {
    // Choose chord tone
    targetPitchClass = chordTones[Math.floor(Math.random() * chordTones.length)];
  } else if (rand < 0.9) {
    // Choose scale tone
    const scaleTones = Array.from(scale);
    targetPitchClass = scaleTones[Math.floor(Math.random() * scaleTones.length)];
  } else {
    // Chromatic passing tone
    targetPitchClass = Math.floor(Math.random() * 12);
  }

  // Prefer stepwise motion (within 2 semitones)
  const octave = Math.floor(currentMidi / 12);
  const candidates = [
    octave * 12 + targetPitchClass,       // Same octave
    (octave - 1) * 12 + targetPitchClass, // Octave below
    (octave + 1) * 12 + targetPitchClass  // Octave above
  ];

  // Choose closest candidate (stepwise preference)
  return candidates.reduce((closest, candidate) => {
    return Math.abs(candidate - currentMidi) < Math.abs(closest - currentMidi)
      ? candidate
      : closest;
  });
}
```

### Pattern 5: Context Compression for Token Efficiency
**What:** Use compact parameter extraction instead of full MIDI context
**When to use:** Generation prompts (vs editing prompts which need full context)
**Example:**
```typescript
// Generation system prompt is MUCH smaller than editing prompt
// No existing MIDI notes to serialize, only parameters to extract

function buildGenerationSystemPrompt(): string {
  return `You are a music generation parameter extractor. The user will describe the music they want to create. Extract structured parameters.

## Your job:
1. Identify the genre (lofi, trap, boom-bap, jazz, classical, pop)
2. Extract tempo (BPM) - if not specified, use genre defaults
3. Extract key and scale - if not specified, choose based on genre conventions
4. Extract time signature - if not specified, default to 4/4
5. Extract song structure - if not specified, use standard pop structure
6. Infer emotion (valence: happy/sad, arousal: energetic/calm)
7. Choose instruments appropriate for genre

## Genre defaults:
- lofi: 70-90 BPM, minor, laid-back (valence: -0.3, arousal: -0.5)
- trap: 140-160 BPM, minor, dark and energetic (valence: -0.5, arousal: 0.7)
- boom-bap: 85-95 BPM, minor, nostalgic (valence: 0.0, arousal: -0.3)

Output only the structured parameters, no explanatory text.`;
}

// This prompt is ~500 tokens vs 2000-5000 tokens for editing prompts
// Significant cost savings: $2.50/M input tokens = ~$0.00125 vs ~$0.005-$0.0125
```

### Anti-Patterns to Avoid
- **End-to-end neural generation:** LLMs generating raw MIDI note arrays produce musically incoherent results (random notes, poor voice leading, theory violations)
- **Single-shot generation without validation:** Always validate generated MIDI against music theory rules before returning to user
- **Ignoring genre conventions:** Generic chord progressions sound bland; use genre-specific templates and patterns
- **Over-reliance on LLM for musical decisions:** Use LLM for prompt parsing and high-level decisions, use algorithms for note-level generation
- **Generating all tracks simultaneously:** Generate structure first, then chords, then rhythm, then melody/bass in layers (easier to control and validate)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chord progression generation | Random chord selection or naive LLM generation | Tonal.js Progression module with functional harmony rules | Chord progressions follow complex voice-leading rules; Tonal handles roman numeral conversion, key transposition, and chord extensions |
| Scale degree calculation | Manual modulo arithmetic | Tonal.js Scale.degrees() | Handles enharmonic equivalence, mode rotation, and interval math correctly |
| Rhythm quantization | Custom tick rounding | PPQ-based tick grid alignment | Easy to create off-grid notes or swing issues; use tick_per_beat * subdivision math |
| Melody harmonization | LLM-generated harmony notes | Tonal.js Chord.get() to extract chord tones, then add harmonies at 3rd/5th intervals | Harmony follows strict interval rules (parallel fifths, voice crossing avoidance); algorithmic approach is faster and more correct |
| Song structure parsing | Custom string parsing | LLM with structured output schema | Structure descriptions are ambiguous ("verse-chorus-verse" vs "AABA"); LLM handles natural language better |
| Tempo/time signature extraction | Regex patterns | LLM with Zod schema validation | Tempo can be specified many ways ("slow", "120 bpm", "allegro"); LLM normalizes to numeric BPM |

**Key insight:** Music generation requires **hybrid architecture** - LLMs excel at understanding intent, algorithms excel at producing theory-correct output. Splitting the tasks leverages strengths of each approach.

## Common Pitfalls

### Pitfall 1: Generating Musically Incoherent Chord Progressions
**What goes wrong:** Random chord selection or LLM-generated progressions produce jarring, non-functional harmony
**Why it happens:** Not all chord transitions sound good; functional harmony requires specific resolution patterns (V→I, ii→V, etc.)
**How to avoid:** Use pre-defined progression templates per genre, or implement circle-of-fifths based transition rules
**Warning signs:** Chords don't resolve, progressions sound random or aimless, no sense of tonal center

### Pitfall 2: Rhythm Patterns That Don't Match Genre
**What goes wrong:** Generated drum patterns don't sound like the specified genre (trap with boom-bap rhythm, lofi with dense hi-hats)
**Why it happens:** Genre conventions are highly specific (trap = fast hi-hat rolls, boom-bap = sparse swung drums, lofi = laid-back quarter notes)
**How to avoid:** Use genre-specific rhythm templates (hard-coded patterns), don't generate rhythms from scratch
**Warning signs:** User complains "this doesn't sound like trap", rhythm feels generic or out of place

### Pitfall 3: Melody Lines With Poor Voice Leading
**What goes wrong:** Large melodic leaps, notes outside scale, no relationship to underlying chords
**Why it happens:** Random note selection without constraints, or LLM generating notes without music theory knowledge
**How to avoid:** Use weighted random walk that prefers stepwise motion, chord tones on strong beats, and stays within scale
**Warning signs:** Melody sounds jumpy or random, doesn't outline the harmony, feels disconnected from chords

### Pitfall 4: Token Cost Explosion From Full MIDI Serialization
**What goes wrong:** Including generated MIDI in prompt for refinement causes massive token costs
**Why it happens:** Each generated note serializes to ~50-100 tokens; 100-note track = 5000-10000 tokens
**How to avoid:** Generate in layers (structure → chords → rhythm → melody), validate each layer, don't serialize full MIDI back to LLM
**Warning signs:** Generation requests cost >10x editing requests, slow response times, OpenAI rate limits

### Pitfall 5: Ignoring User's Specified Parameters
**What goes wrong:** Generated MIDI is in wrong key, wrong tempo, or wrong genre
**Why it happens:** LLM hallucinates parameters or ignores schema constraints; validation not enforced
**How to avoid:** Use OpenAI Structured Outputs with strict Zod schemas, validate extracted parameters before generation
**Warning signs:** User says "I asked for C major but got G minor", tempo doesn't match request

### Pitfall 6: No Variation Between Sections
**What goes wrong:** Verse and chorus sound identical, song is repetitive and boring
**Why it happens:** Using same chord progression and melody for all sections
**How to avoid:** Vary chord progressions by section type (verse = stable, chorus = dynamic), adjust note density and register
**Warning signs:** Song sounds monotonous, no dynamic arc, user complains about repetition

### Pitfall 7: Instrument Selection Doesn't Match Genre
**What goes wrong:** Using piano for trap bass line, or electric guitar for classical piece
**Why it happens:** Not using genre-appropriate General MIDI instrument mapping
**How to avoid:** Define instrument presets per genre (trap = 808 sub bass, lofi = electric piano, jazz = upright bass)
**Warning signs:** Generated music sounds "wrong" for genre, instrument choice feels anachronistic

## Code Examples

Verified patterns from official sources:

### Using Tonal.js for Chord Progressions
```typescript
// Source: Tonal.js documentation (github.com/tonaljs/tonal)
import { Progression, Key, Chord } from 'tonal';

// Convert roman numerals to actual chords in key
const chords = Progression.fromRomanNumerals('C', ['I', 'IV', 'V', 'I']);
// => ['C', 'F', 'G', 'C']

// Get all chords in a key
const keyInfo = Key.majorKey('C');
// => { tonic: 'C', chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'] }

// Get chord notes for voicing
const cmajNotes = Chord.get('Cmaj7').notes;
// => ['C', 'E', 'G', 'B']
```

### Calculating Tick Positions for Notes
```typescript
// Source: MIDI specification (midi.org/community/midi-software/calculate-absolute-time-from-ppq-and-ticks)

// Formula: µs_per_tick = µs_per_quarter / ticks_per_quarter
// tempo = µs_per_quarter_note = 60000000 / bpm
// ppq = ticks_per_quarter_note

function bpmToMicrosPerQuarter(bpm: number): number {
  return Math.floor(60000000 / bpm);
}

function ticksPerBar(ppq: number, timeSignatureNumerator: number): number {
  // Assumes denominator is quarter note (4)
  return ppq * timeSignatureNumerator;
}

// Example: 120 BPM, 4/4 time, 480 PPQ
const ppq = 480;
const bpm = 120;
const ticksInBar = ticksPerBar(ppq, 4); // => 1920 ticks

// Place notes on beat boundaries
const beat1 = 0;
const beat2 = ppq * 1;     // 480
const beat3 = ppq * 2;     // 960
const beat4 = ppq * 3;     // 1440
const nextBar = ppq * 4;   // 1920
```

### OpenAI Structured Outputs for Parameter Extraction
```typescript
// Source: OpenAI documentation (platform.openai.com/docs/guides/structured-outputs)
import { openai } from '@/lib/openai/client';
import { zodResponseFormat } from 'openai/helpers/zod';

const completion = await openai.chat.completions.parse({
  model: 'gpt-4o-2024-08-06',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  response_format: zodResponseFormat(GenerationParamsSchema, 'generation_params')
});

const parsed = completion.choices[0]?.message?.parsed;
// parsed is guaranteed to match GenerationParamsSchema structure
```

### Genre-Specific Instrument Selection
```typescript
// Source: General MIDI specification + genre research (existing codebase genres.ts)

const GENRE_INSTRUMENTS: Record<string, { drums: number; bass: number; chords: number; melody: number }> = {
  lofi: {
    drums: 0,  // GM Standard Kit (channel 10)
    bass: 33,  // GM Acoustic Bass
    chords: 4, // GM Electric Piano 1
    melody: 11 // GM Vibraphone
  },
  trap: {
    drums: 0,  // GM Standard Kit
    bass: 38,  // GM Synth Bass 1 (808-style)
    chords: 90, // GM Pad 3 (polysynth)
    melody: 81  // GM Lead 2 (sawtooth)
  },
  'boom-bap': {
    drums: 0,  // GM Standard Kit
    bass: 33,  // GM Acoustic Bass
    chords: 4,  // GM Electric Piano 1
    melody: 65  // GM Alto Sax (jazzy)
  },
  jazz: {
    drums: 32, // GM Jazz Kit
    bass: 32,  // GM Acoustic Bass (finger)
    chords: 0,  // GM Acoustic Grand Piano
    melody: 66  // GM Tenor Sax
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| End-to-end neural MIDI generation (MusicVAE, PerformanceRNN) | Hybrid LLM + rule-based generation (MIDI-GPT, M6(GPT)3) | 2024-2025 | Improved musical coherence, controllability, and theory compliance |
| Perplexity-based token removal for compression | Token classification with semantic chunking (LLMLingua-2, ChunkKV) | 2025-2026 | 3-6x faster inference, 95-98% accuracy retention |
| Fixed chord progressions | Genetic algorithm with fitness functions for emotion and theory | 2024 (M6(GPT)3) | Better variety while maintaining coherence, emotional control |
| Simple rhythm templates | Markov chain state transitions for drum fills | 2024 (M6(GPT)3) | More natural-sounding drum variations |

**Deprecated/outdated:**
- **MusicLM/MusicGen audio generation:** Generates audio (not MIDI), requires massive compute, lacks controllability
- **Pure GPT MIDI generation:** LLMs generate musically incoherent note sequences, better for parameter extraction
- **Hand-rolled music theory algorithms:** Tonal.js and similar libraries are mature, comprehensive, and well-tested

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal generation layer order**
   - What we know: Research shows layered generation (structure → chords → rhythm → melody) works better than simultaneous generation
   - What's unclear: Exact order and dependencies between layers (should bass be generated before or after melody?)
   - Recommendation: Start with structure → chords → drums → bass → melody (follows dependency graph: bass follows chord roots, melody follows chords)

2. **How much to use LLM vs algorithms**
   - What we know: LLMs excel at prompt parsing, algorithms excel at note generation
   - What's unclear: Should LLM suggest chord progressions (high-level) and algorithms do voicing? Or algorithms do entire progression selection?
   - Recommendation: LLM extracts parameters only, algorithms handle all note generation; revisit if quality is poor

3. **Validation thresholds for generated content**
   - What we know: Phase 5 has music theory validators (scale, genre, transitions)
   - What's unclear: Should generated MIDI be validated with same strict rules as edits? Or allow more freedom for creativity?
   - Recommendation: Validate generated MIDI with same rules but WARNING severity instead of ERROR (don't block generation, just warn user)

4. **How to handle "creative" vs "safe" generation modes**
   - What we know: Users may want either conventional (safe) or experimental (creative) generation
   - What's unclear: How to parameterize this? Temperature in genetic algorithm? Strictness in validation?
   - Recommendation: Defer to v2; start with safe/conventional generation to validate core value

## Sources

### Primary (HIGH confidence)
- **MIDI-GPT Research Paper** (arxiv.org/html/2501.17011v1) - Tokenization strategy, control attributes, multitrack generation patterns (January 2025)
- **M6(GPT)3 Research Paper** (arxiv.org/html/2409.12638v1) - Genetic algorithm approach, music theory integration, chord progression generation (September 2024)
- **Tonal.js GitHub Repository** (github.com/tonaljs/tonal) - Music theory library capabilities, chord progression, scale operations
- **OpenAI Structured Outputs Documentation** (platform.openai.com/docs/guides/structured-outputs) - Structured output constraints, Zod integration (verified via WebSearch, 403 on direct fetch)
- **MIDI Timing Specification** (midi.org/community/midi-software/calculate-absolute-time-from-ppq-and-ticks) - PPQ, tempo, tick calculation formulas

### Secondary (MEDIUM confidence)
- **AI Music Generation Best Practices 2026** - Prompt engineering strategies verified across multiple sources (soundverse.ai, musicsmith.ai)
- **Genre Drum Pattern Characteristics** - Trap, lofi, boom-bap patterns verified across multiple sources (midimighty.com, slimegreenbeats.com)
- **Voice Leading Rules** - Functional harmony and voice leading principles from educational sources (fiveable.me, musictheory.pugetsound.edu)
- **Chord Progression Algorithms** - Musical Chords Java Algorithm paper (arxiv.org/html/2409.06024v1, September 2024)

### Tertiary (LOW confidence)
- **LLM Token Optimization Strategies 2026** - Context compression techniques verified via multiple sources, but not MIDI-specific (aussieai.com, agenta.ai, oneuptime.com)
- **ChatGPT Music Prompting** - User examples of GPT-4 for chord progressions, not official documentation (towardsdatascience.com, audiocipher.com)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already integrated and verified in codebase
- Architecture: MEDIUM - Patterns based on recent research (2024-2025) but not yet implemented in production systems
- Pitfalls: MEDIUM - Derived from research papers and genre pattern analysis, some from general music theory knowledge

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - music theory is stable, but AI generation techniques evolving rapidly)

## Research Context

**Locked Decisions (from prior phases):**
- GPT-4o for natural language processing (use for prompt parsing)
- OpenAI Structured Outputs with Zod schemas (extend with GenerationParamsSchema)
- Tonal.js for music theory operations (use for chord progressions, scale operations)
- Tick-based time representation (use for all generated note positions)
- General MIDI instrument mapping (use for track instrument selection)
- Music theory validation pipeline (reuse for validating generated MIDI)

**No CONTEXT.md found** - No user decisions from `/gsd:discuss-phase`, full discretion on implementation approach.

## Implementation Strategy Recommendation

Based on research findings and existing codebase patterns:

1. **Extend OpenAI schemas** with `GenerationParamsSchema` for prompt parsing
2. **Create generation modules** (chordGenerator, rhythmGenerator, melodyGenerator) using algorithmic approaches
3. **Reuse existing validation** from Phase 5 to ensure generated MIDI is theory-compliant
4. **Build `/api/nl-generate` endpoint** following same pattern as `/api/nl-edit`
5. **Add Zustand store** for generation state (similar to nlEditStore)
6. **Start with 3-4 genres** (lofi, trap, boom-bap) with hard-coded templates, expand later
7. **Validate each generation layer** before proceeding to next (fail fast on theory violations)

This approach minimizes new dependencies, leverages existing infrastructure, and follows proven patterns from recent research.
