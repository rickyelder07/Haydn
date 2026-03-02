# Phase 12: Template Variations - Research

**Researched:** 2026-03-01
**Domain:** Pattern randomization in rule-based MIDI generation (genreTemplates.ts, rhythmGenerator.ts, chordGenerator.ts)
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TMPL-01 | Each genre has 3-5 verse pattern variations | Current `genreTemplates.ts` has exactly 2 verse chord progressions per genre. Expand each genre to 3-5 `verse` arrays. |
| TMPL-02 | Each genre has 3-5 chorus pattern variations | Current `genreTemplates.ts` has exactly 2 chorus chord progressions per genre. Expand each genre to 3-5 `chorus` arrays. |
| TMPL-03 | Each genre has 8 drum fill variations | No drum fills exist today. Add a new `drumFills` array per genre in `genreTemplates.ts` (8 fills each). |
| TMPL-04 | Pattern variations selected randomly per generation | `chordGenerator.ts` currently hard-codes `progressionIndex` per section type. Replace with `Math.floor(Math.random() * progressions.length)` for verse and chorus. |
| TMPL-05 | Drum fills selected randomly at section boundaries | `rhythmGenerator.ts` currently has no fill injection. Add fill selection at the last bar of each section. |
| TMPL-06 | Generated MIDI maintains genre consistency across all pattern variations | All variation arrays must be authored to stay within the genre's harmonic/rhythmic identity. Verify with manual playback. |
</phase_requirements>

---

## Summary

Phase 12 is a pure data + algorithm extension of the existing template generation system. No new libraries, no new routes, no new stores are needed. The entire scope is: (1) expand `genreTemplates.ts` with more chord progression variants and 8 drum fill patterns per genre, (2) fix `chordGenerator.ts` to randomly select among all available progressions instead of hard-coding by section type, and (3) update `rhythmGenerator.ts` to inject a randomly chosen fill at the final bar of each section boundary.

The current system already has the right architecture. `genreTemplates.ts` stores chord progressions as `Record<SectionType, string[][]>` — the outer array is already an array of progressions. The issue is `chordGenerator.ts` only picks index 0 (verse) or index 1 (chorus) deliberately, ignoring any additional progressions that may exist. Adding variations is a data authoring task (more arrays in the template) plus a one-line fix in `chordGenerator.ts` to use `Math.random()` selection.

Drum fills are a new concept that requires a new field in the `GenreTemplate` interface (`drumFills: DrumPattern[]`) and new logic in `rhythmGenerator.ts` to detect section boundaries (last bar of each section) and splice in a fill pattern. The fill replaces the standard pattern for that one bar, providing the rhythmic transition signal that makes a generation feel "live" rather than repetitive.

**Primary recommendation:** Add 3-5 chord progressions per section type per genre directly in `genreTemplates.ts`, add 8 `drumFills` per genre, randomize selection in both `chordGenerator.ts` and `rhythmGenerator.ts`. Total new code: ~300 lines of data + ~40 lines of logic changes.

---

## Standard Stack

### Core (all already in project — zero new installations)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tonal.js | 6.4.3 | `Progression.fromRomanNumerals()` converts roman numeral arrays to actual chord names | Already used in `chordGenerator.ts`; proven correct across all 6 genres |
| TypeScript | project | `GenreTemplate` interface extension for `drumFills` | Type safety; prevents malformed patterns at compile time |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Math.random()` | JS built-in | Uniform random selection from variation arrays | Selection of chord progressions and drum fills; no seeding needed for this use case |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored chord progressions | Algorithmic generation from circle of fifths | Hand-authored gives predictable, genre-correct results; algorithmic risks harmonic inconsistency across genres |
| Simple bar-boundary fill injection | Markov chain drum transitions | Markov is overkill; 8 pre-authored fills per genre cover all practical variation with zero runtime risk |
| Replacing last bar only | Replacing last 2 bars | 1-bar fill is musically standard (fills occur in the final bar before a section change); avoids disrupting melodic/chord alignment |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Current Project Structure (relevant files)
```
src/lib/nl-generation/
├── genreTemplates.ts     # MODIFY: add chord progression variants + drumFills per genre
├── chordGenerator.ts     # MODIFY: randomize progression index selection
├── rhythmGenerator.ts    # MODIFY: inject fills at section boundaries
├── melodyGenerator.ts    # NO CHANGE (not affected by chord variation selection)
├── bassGenerator.ts      # NO CHANGE
└── midiAssembler.ts      # NO CHANGE
```

No new files required. No new directories required.

### Pattern 1: Expanding Chord Progressions in genreTemplates.ts

**What:** Each `SectionType` key currently maps to a 2-element array of progressions. Expand to 3-5 elements. The existing `string[][]` type already supports any number of progressions — no interface change needed for chords.

**When to use:** Any time you want the same section type to have multiple valid harmonic paths.

**Example (lofi verse expanded from 2 to 4 progressions):**
```typescript
// Source: existing genreTemplates.ts pattern, extended
verse: [
  ['ii7', 'V7', 'Imaj7', 'vi7'],       // Existing variation 1
  ['Imaj7', 'IVmaj7', 'vi7', 'V7'],    // Existing variation 2
  ['vi7', 'IVmaj7', 'ii7', 'V7'],      // NEW: vi-IV-ii-V (falling thirds feel)
  ['Imaj7', 'iii7', 'IVmaj7', 'V7'],   // NEW: ascending sequence
],
```

**Genre consistency rule:** All variations for a section type must use the same diatonic vocabulary as existing progressions for that genre. Lofi uses maj7/min7 extensions; trap uses power-chord modal; jazz uses secondary dominants; classical uses triads; pop uses plain triads; boom-bap mixes triad and 7th.

### Pattern 2: DrumFill Interface Addition to genreTemplates.ts

**What:** Add a new `drumFills: DrumPattern[]` field to the `GenreTemplate` interface. Each fill is a single-bar `DrumPattern` (same tick-offset format as existing patterns). 8 fills per genre.

**When to use:** Fills are injected at the last bar of each structural section boundary.

**Example interface extension:**
```typescript
// Source: existing genreTemplates.ts GenreTemplate interface, extended
export interface GenreTemplate {
  name: string;
  chordProgressions: Record<SectionType, string[][]>;
  drumPatterns: Record<SectionType, DrumPattern>;
  drumFills: DrumPattern[];           // NEW: 8 fill variations, index chosen randomly
  defaultInstrumentation: { ... };
  melodyConfig: MelodyConfig;
  bassConfig: BassConfig;
}
```

**Example fills (lofi — 8 variations):**
```typescript
// All tick values are within a single bar (0-1919 for 4/4 at PPQ=480)
drumFills: [
  // Fill 1: Basic single-kick punctuation
  { kick: [0, 720, 1440, 1680], snare: [480, 960, 1440], hihat: [0, 480, 960, 1440], openHihat: [], velocityVariation: 0.15 },
  // Fill 2: Snare roll into section
  { kick: [0], snare: [480, 720, 960, 1200, 1440, 1560, 1680], hihat: [], openHihat: [], velocityVariation: 0.2 },
  // Fill 3: Open hi-hat accent on 4
  { kick: [0, 960], snare: [480, 1440], hihat: [0, 480, 960], openHihat: [1440], velocityVariation: 0.15 },
  // Fill 4: Kick-heavy fill
  { kick: [0, 480, 720, 960, 1200, 1440], snare: [480, 1440], hihat: [], openHihat: [], velocityVariation: 0.2 },
  // Fill 5: Sparse - snare only
  { kick: [], snare: [480, 1200, 1440, 1680], hihat: [0, 480, 960, 1440], openHihat: [], velocityVariation: 0.1 },
  // Fill 6: Double snare at bar end
  { kick: [0, 960], snare: [480, 1440, 1560, 1680], hihat: [0, 480, 960], openHihat: [], velocityVariation: 0.15 },
  // Fill 7: 16th-note hihat run
  { kick: [0, 960], snare: [480, 1440], hihat: [1200, 1320, 1440, 1560, 1680, 1800], openHihat: [], velocityVariation: 0.2 },
  // Fill 8: Open hi-hat sweep
  { kick: [0], snare: [480, 1440], hihat: [0, 240, 480, 720], openHihat: [960, 1200, 1440, 1680], velocityVariation: 0.2 },
]
```

### Pattern 3: Random Progression Selection in chordGenerator.ts

**What:** Replace hard-coded `progressionIndex` logic with uniform random selection. The current code at lines 66-73 of `chordGenerator.ts` selects index 0 for verse, 1 for chorus/bridge, and random for intro/outro. Replace the entire block with `Math.floor(Math.random() * progressions.length)` for all section types.

**When to use:** Every call to `generateChordProgression()` — which happens once per `assembleProject()` call.

**Before (current code):**
```typescript
// Source: chordGenerator.ts lines 66-73 (current)
let progressionIndex = 0;
if (sectionType === 'chorus' || sectionType === 'bridge') {
  progressionIndex = Math.min(1, progressions.length - 1);
} else if (sectionType === 'intro' || sectionType === 'outro') {
  progressionIndex = Math.floor(Math.random() * progressions.length);
}
```

**After (replacement):**
```typescript
// Each section type randomly selects from all available progressions
const progressionIndex = Math.floor(Math.random() * progressions.length);
```

**Why this works:** With 3-5 variations per section type, uniform random selection gives appropriate variety. Each call to `assembleProject()` independently rolls for each section, so verse 1 may use progression A while verse 2 (in the same song) uses progression C — which is musically valid since the chord generator repeats the selected progression for all bars in that section.

**Important:** The randomization happens PER SECTION per call — not per bar. A single verse section uses one consistent progression throughout. This is correct musical behavior (verses are internally consistent).

### Pattern 4: Fill Injection in rhythmGenerator.ts

**What:** Detect the last bar of each structural section and replace its standard drum pattern with a randomly selected fill from `template.drumFills`. All other bars use the standard section pattern unchanged.

**When to use:** During `generateDrumTrack()`, track section boundaries and apply fills at `bar === section.bars - 1`.

**Example (replacement logic in generateDrumTrack):**
```typescript
// Source: rhythmGenerator.ts pattern, modified
for (const section of structure) {
  const sectionType = section.section as SectionType;
  const pattern = template.drumPatterns[sectionType] || template.drumPatterns.verse;

  for (let bar = 0; bar < section.bars; bar++) {
    const barStartTick = currentTick;

    // Determine which pattern to use for this bar
    const isLastBarOfSection = bar === section.bars - 1;
    const activePattern = (isLastBarOfSection && template.drumFills.length > 0)
      ? template.drumFills[Math.floor(Math.random() * template.drumFills.length)]
      : pattern;

    // ... render activePattern notes using existing logic ...
    currentTick += ticksPerBar;
  }
}
```

**Key constraint:** The fill selection per section is random at render time. Each generation call produces a different fill sequence. This satisfies TMPL-05 ("selected randomly at section boundaries").

### Anti-Patterns to Avoid

- **One progression selected for the whole song:** The random selection must happen per section, not once at the top of `generateChordProgression()`. The current loop structure already iterates per section, so the random call should be inside the `for (const section of structure)` loop.
- **Fills that change the bar length:** All fills must have tick offsets in the range `[0, 4*ppq-1]` (i.e., 0-1919 at PPQ=480). A fill that places notes beyond 1919 ticks will collide with the next section's bar 0.
- **Fills with empty arrays causing silent bars:** Classical already returns `[]` for drum tracks. Do not inject fills for classical. Guard: `if (genre === 'classical') return []` (existing guard in `rhythmGenerator.ts`).
- **Authoring variations that violate genre identity:** A lofi variation should never use power chords. A trap variation should never use `Imaj7`. The variations must be authored within each genre's diatonic vocabulary and feel.
- **Seeding Math.random() for reproducibility:** Don't add a seed parameter. The requirement is unpredictability ("sounds different across generations"), not reproducibility. Seeding would complicate the API for no user benefit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Roman numeral → chord name conversion | Custom chord lookup tables | `Progression.fromRomanNumerals(key, numerals)` from Tonal.js | Handles enharmonic equivalence, minor scale variants, extended chords; already used in chordGenerator.ts |
| Weighted random selection | Custom probability distribution | `Math.floor(Math.random() * array.length)` | Uniform selection is correct here; all variations are equally valid musically |
| Section boundary detection | Separate data structure | Track `bar === section.bars - 1` in the existing loop | Already iterates sections and bars; no need for a lookup structure |
| Fill pattern generation | Algorithmic fill creation | Hand-authored `DrumPattern[]` arrays | Algorithmic fills risk rhythmic incoherence; 8 curated fills per genre guarantee musical quality |

**Key insight:** This phase is 90% data authoring and 10% logic change. The infrastructure already exists and works correctly. The work is writing good musical content (chord progressions and drum fills), not engineering.

---

## Common Pitfalls

### Pitfall 1: Progression Count Mismatch Across Genres
**What goes wrong:** Some genres end up with 3 verse variations and 5 chorus variations. Inconsistency makes the code harder to maintain and may cause unexpected behavior if code ever assumes uniform count.
**Why it happens:** Data authoring without a spec for how many variations each section type gets.
**How to avoid:** Target 3-5 variations per section type for verse and chorus; 1-3 for bridge, intro, outro (these sections appear less often and matter less for variety). Document the count in a comment at the top of each genre block.
**Warning signs:** `verse.length` is 3 for lofi but 5 for trap with no explanation.

### Pitfall 2: Drum Fill Overwrites Wrong Bar
**What goes wrong:** The fill is inserted at bar 0 of a section (the first bar) instead of the last bar.
**Why it happens:** Off-by-one in `bar === section.bars - 1` condition — particularly if bars are 0-indexed in some places and 1-indexed in others.
**How to avoid:** Confirm `section.bars` is the count (e.g., 8) and bars are iterated as `for (let bar = 0; bar < section.bars; bar++)`, so the last iteration is `bar === section.bars - 1`. This is the current pattern in `rhythmGenerator.ts`.
**Warning signs:** First bar of every section sounds like a fill; section endings sound normal.

### Pitfall 3: Tonal.js Fails to Parse Extended Roman Numerals
**What goes wrong:** Novel chord symbols like `bIIImaj7` (flattened third with maj7) or `IVaug` fail to parse in `Progression.fromRomanNumerals()`, returning empty strings that silently skip entire bars.
**Why it happens:** Tonal.js supports standard roman numerals but not all extensions. The existing code already has a fallback to `['I', 'IV', 'V', 'I']` when `chordNames.length === 0`.
**How to avoid:** Test every new roman numeral variation in `chordGenerator.ts` against Tonal.js before committing. Stick to symbols already proven in the existing template: `maj7`, `7`, `m7`, `dim7`, `sus4`. Avoid `aug`, `#`, `b` prefixes unless verified.
**Warning signs:** Console shows `[chordGenerator] Tonal returned empty, using fallback` for new variations.

### Pitfall 4: Section with 1 Bar Gets a Fill (No Standard Pattern)
**What goes wrong:** A 1-bar section has `bar === 0 === section.bars - 1` on the very first iteration, so the entire section is a fill with no standard pattern at all.
**Why it happens:** The fill condition fires for the last bar, and 1-bar sections have only one bar.
**How to avoid:** Guard the fill injection: only apply fills when `section.bars >= 2`. A 1-bar section should use the standard pattern.
**Warning signs:** Short intro/outro sections sound like drum fills throughout.

### Pitfall 5: Every Generation Uses the Same Variation Because randomness is called once outside the loop
**What goes wrong:** One call to `Math.floor(Math.random() * progressions.length)` before the section loop picks the same progression for all sections of the same type.
**Why it happens:** Misplacing the random call outside the `for (const section of structure)` loop.
**How to avoid:** Place the `progressionIndex = Math.floor(...)` INSIDE the section loop, after retrieving `progressions` for the current section. Each section independently rolls its progression.
**Warning signs:** All verses use the same chord pattern even when 4 variations are defined.

---

## Code Examples

### Random Chord Progression Selection (replacement block in chordGenerator.ts)
```typescript
// Source: chordGenerator.ts, inside for (const section of structure) loop
// Replace lines 66-73 with:
const progressions = template.chordProgressions[sectionType] || template.chordProgressions.verse;
const progressionIndex = Math.floor(Math.random() * progressions.length);
const romanNumerals = progressions[progressionIndex] || ['I', 'IV', 'V', 'I'];
```

### Fill Injection Guard (rhythmGenerator.ts)
```typescript
// Source: rhythmGenerator.ts, inside for (let bar = 0; bar < section.bars; bar++) loop
const isLastBarOfSection = bar === section.bars - 1;
const useFill = isLastBarOfSection && section.bars >= 2 && template.drumFills.length > 0;
const activePattern = useFill
  ? template.drumFills[Math.floor(Math.random() * template.drumFills.length)]
  : pattern;
```

### GenreTemplate Interface Extension
```typescript
// Source: genreTemplates.ts, GenreTemplate interface
export interface GenreTemplate {
  name: string;
  chordProgressions: Record<SectionType, string[][]>;
  drumPatterns: Record<SectionType, DrumPattern>;
  drumFills: DrumPattern[];           // 8 single-bar fill patterns, selected randomly at section boundaries
  defaultInstrumentation: {
    drums: number;
    bass: number;
    chords: number;
    melody: number;
  };
  melodyConfig: MelodyConfig;
  bassConfig: BassConfig;
}
```

### Authoring Drum Fill for Trap Genre (example of genre-appropriate content)
```typescript
// Source: genre knowledge — trap fills use rapid 16th hi-hat rolls and 808 accents
// All offsets in [0..1919] for PPQ=480, 4/4 bar
drumFills: [
  // Fill 1: Classic trap roll into drop
  { kick: [0, 480, 960], snare: [480, 1440], hihat: [1200, 1320, 1440, 1560, 1680, 1800], openHihat: [], velocityVariation: 0.25 },
  // Fill 2: Snare flam on beat 4
  { kick: [0, 720, 960], snare: [480, 1360, 1440, 1520], hihat: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800], openHihat: [], velocityVariation: 0.3 },
  // ... 6 more fills
]
```

### Lofi Verse Chord Progressions (3-5 range, diatonic maj7/min7 vocabulary)
```typescript
// Source: genre knowledge — lofi uses jazz-derived ii-V-I patterns, extended chords, smooth voice leading
verse: [
  ['ii7', 'V7', 'Imaj7', 'vi7'],         // Variation 1 (existing) — ii-V-I-vi turnaround
  ['Imaj7', 'IVmaj7', 'vi7', 'V7'],      // Variation 2 (existing) — I-IV-vi-V
  ['vi7', 'IVmaj7', 'ii7', 'V7'],        // Variation 3 — vi-IV-ii-V falling motion
  ['Imaj7', 'iii7', 'vi7', 'IVmaj7'],    // Variation 4 — I-iii-vi-IV (Beatles-ish)
  ['ii7', 'bVII7', 'Imaj7', 'vi7'],      // Variation 5 — Backdoor ii-bVII-I (jazz flavour)
],
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 2 chord progressions per section, hard-coded index selection | 3-5 progressions per section, randomly selected per generation | Phase 12 | Each generation produces different harmonic content; satisfies TMPL-01, TMPL-02, TMPL-04 |
| No drum fills (same pattern repeats throughout) | 8 fills per genre, injected randomly at section boundaries | Phase 12 | Sections feel like they "land" musically; satisfies TMPL-03, TMPL-05 |
| Template generation predictable (same song each time) | Template generation unpredictable but genre-consistent | Phase 12 | Satisfies TMPL-06 — variety without losing genre identity |

**No deprecations:** The existing 2-variation structure is simply expanded. The `string[][]` type and `DrumPattern` interface are already compatible with any number of elements.

---

## Open Questions

1. **Should chord progressions vary per section INSTANCE or per section TYPE?**
   - What we know: The current loop iterates all sections and within each section picks one progression. If a song has two verse sections (verse 1 and verse 2), each rolls independently — verse 1 might use variation A, verse 2 might use variation C.
   - What's unclear: Is this the desired behavior? Or should all verses in the same song use the same progression for internal consistency?
   - Recommendation: Independent random selection per section instance is fine and matches TMPL-04's spirit ("selected randomly per generation"). Musical consistency within a generation is maintained because (a) each section still uses one internally consistent progression, and (b) all variations are in the same key/genre vocabulary. Go with independent selection.

2. **How many drum fills for classical (which has no drums)?**
   - What we know: Classical genre has empty drum patterns. `rhythmGenerator.ts` returns `[]` immediately for classical.
   - What's unclear: Should `drumFills: []` be required in the `GenreTemplate` interface even for classical?
   - Recommendation: Yes — keep the interface consistent. Classical gets `drumFills: []` (empty array). The fill injection guard `template.drumFills.length > 0` will prevent any fill injection. No special-casing needed.

3. **Should fills be seeded/repeatable for user testing?**
   - What we know: The requirement says "selected randomly" and "sounds different across generations." There is no reproducibility requirement.
   - What's unclear: Whether the user/QA process will want to reproduce a specific output to verify quality.
   - Recommendation: Do not seed. If QA needs to verify, they can test by generating 5-10 times and confirming outputs differ. Seeding adds complexity for no user-facing benefit.

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/nl-generation/genreTemplates.ts` — current `GenreTemplate` interface, all 6 genre definitions, `DrumPattern` type, existing chord progressions (2 per section per genre)
- Project codebase: `src/lib/nl-generation/chordGenerator.ts` — progression index selection logic (lines 66-73), existing fallback to I-IV-V-I, `Progression.fromRomanNumerals()` usage
- Project codebase: `src/lib/nl-generation/rhythmGenerator.ts` — bar iteration pattern, velocity variation logic, hi-hat arousal modifier, existing section loop structure
- Project codebase: `src/lib/nl-generation/midiAssembler.ts` — `assembleProject()` entrypoint, shows all generators are called sequentially, no changes needed here

### Secondary (MEDIUM confidence)
- Phase 6 RESEARCH.md — genre drum pattern characteristics (lofi: sparse quarter hats; trap: dense 16th rolls; boom-bap: swung 8ths) used to author fill content
- Music theory knowledge: Standard drum fill conventions (fills occupy the last 1-2 bars of a section; fills build rhythmic tension before section change; genre fills differ in density and element focus)

### Tertiary (LOW confidence)
- Genre-specific chord progression theory — variations authored from general knowledge of jazz-derived lofi harmony, modal trap harmony, walking-bass jazz, classical functional harmony, pop I-V-vi-IV universality. These are standard patterns from music theory education but not sourced from a specific document in this research.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code in-project, no new dependencies, all patterns proven in production
- Architecture: HIGH — changes are minimal and localized; `genreTemplates.ts` interface extension is straightforward; both modifier sites (chordGenerator, rhythmGenerator) are single-loop changes
- Fill/variation content: MEDIUM — chord progressions and drum fills are authored from genre knowledge, not empirically tested for musical quality; human verification of output quality is required (TMPL-06 is a subjective quality criterion)
- Pitfalls: HIGH — all pitfalls are derived from direct code inspection of the existing system and known JavaScript/Tonal.js behaviors

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (architecture is stable; no external API dependencies; only risk is discovering a new Tonal.js parsing limitation during implementation)
