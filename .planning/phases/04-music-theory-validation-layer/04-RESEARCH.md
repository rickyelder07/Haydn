# Phase 4: Music Theory Validation Layer - Research

**Researched:** 2026-01-30
**Domain:** Music theory validation and error handling
**Confidence:** MEDIUM-HIGH

## Summary

Music theory validation in JavaScript/TypeScript applications requires a dedicated library for fundamental operations (scale/chord theory) combined with custom validation logic for context-specific rules. The standard approach uses Tonal.js for core music theory operations, validation pipelines for rule checking, and Result/Either types for type-safe error handling.

Research reveals that while libraries provide primitive operations (e.g., "get notes in C major scale"), the actual validation logic (e.g., "does this edit violate the current key?", "is this chord progression valid for trap music?") must be implemented as custom business logic. Genre-specific validation and smooth transition checking are domain-specific problems without off-the-shelf solutions.

The key architectural challenge is designing a validation pipeline that can reject invalid edits with musical explanations while providing real-time visual feedback in the piano roll UI. This requires converting MIDI note numbers to pitch classes (modulo 12), comparing against scale definitions, and handling enharmonic equivalence correctly.

**Primary recommendation:** Use Tonal.js 4.13+ for music theory primitives, implement custom validators using the chain-of-responsibility pattern, use Result types for error handling, and build genre-specific rule sets as configuration rather than hard-coded logic.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tonaljs/scale | 4.13.3+ | Scale operations, note membership testing | Most mature TypeScript music theory library, functional/pure, modular packages |
| @tonaljs/chord | 4.13.3+ | Chord analysis, detection, generation | Part of Tonal ecosystem, comprehensive chord database |
| @tonaljs/progression | 4.13.3+ | Chord progression utilities, Roman numeral support | Enables harmonic analysis within Tonal ecosystem |
| @tonaljs/note | 4.13.3+ | Note name parsing, MIDI conversion, enharmonic handling | Handles pitch/pitch class distinction correctly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tonaljs/key | 4.13.3+ | Key signature operations, relative keys | For analyzing project-wide key context |
| @tonaljs/chord-detect | 4.13.3+ | Detect chords from note collections | For analyzing existing sections to ensure smooth transitions |
| @thames/monads | Latest | Result/Either types for error handling | Type-safe validation with descriptive error messages |
| fp-ts | Latest | Functional utilities for composing validators | If using advanced functional composition patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tonal.js | Teoria.js | Teoria has less TypeScript support, less modular, not actively maintained |
| Tonal.js | Custom implementation | Don't hand-roll music theory - edge cases are complex (enharmonics, modes, etc.) |
| @thames/monads | Native try/catch | Result types provide better type safety and composition for validation chains |

**Installation:**
```bash
npm install tonal @tonaljs/scale @tonaljs/chord @tonaljs/progression @tonaljs/note @tonaljs/key @tonaljs/chord-detect @thames/monads
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── validation/
│   ├── validators/           # Individual validation rules
│   │   ├── ScaleValidator.ts
│   │   ├── ChordProgressionValidator.ts
│   │   ├── TransitionValidator.ts
│   │   └── GenreValidator.ts
│   ├── ValidationPipeline.ts # Chain-of-responsibility coordinator
│   ├── ValidationResult.ts   # Result type definitions
│   └── rules/                # Genre-specific rule configurations
│       ├── trap.ts
│       ├── jazz.ts
│       └── classical.ts
├── lib/
│   └── music-theory/         # Music theory utilities
│       ├── pitchClass.ts     # MIDI to pitch class conversion
│       └── enharmonic.ts     # Enharmonic equivalence handling
```

### Pattern 1: Validation Pipeline (Chain of Responsibility)

**What:** Execute validators sequentially, short-circuit on first failure, accumulate errors for comprehensive feedback

**When to use:** For validating note edits against multiple rules (scale, progression, transition, genre)

**Example:**
```typescript
// Source: Chain of Responsibility pattern + express-validator concepts
// https://express-validator.github.io/docs/guides/validation-chain/

interface ValidationContext {
  note: HaydnNote;
  track: HaydnTrack;
  project: HaydnProject;
  editType: 'add' | 'move' | 'update';
}

interface ValidationError {
  type: 'scale' | 'progression' | 'transition' | 'genre';
  message: string;           // User-friendly explanation
  technicalReason: string;   // Developer details
  affectedNote?: HaydnNote;
}

type ValidationResult = Result<void, ValidationError[]>;

interface Validator {
  validate(context: ValidationContext): ValidationResult;
}

class ValidationPipeline {
  private validators: Validator[] = [];

  addValidator(validator: Validator): this {
    this.validators.push(validator);
    return this;
  }

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    for (const validator of this.validators) {
      const result = await validator.validate(context);
      if (result.isErr()) {
        errors.push(...result.error);
        // Continue to collect all errors for comprehensive feedback
      }
    }

    return errors.length > 0
      ? Result.err(errors)
      : Result.ok(undefined);
  }
}
```

### Pattern 2: Scale Membership Validation

**What:** Convert MIDI note numbers to pitch classes, check against current scale definition

**When to use:** For validating individual note additions/moves against active key signature

**Example:**
```typescript
// Source: Tonal.js documentation + MIDI pitch class conversion
// https://tonaljs.github.io/tonal/docs
// https://dobrian.github.io/cmp/topics/basics-of-music-theory/5.representing-pitch.html

import { Scale, Note } from 'tonal';

class ScaleValidator implements Validator {
  validate(context: ValidationContext): ValidationResult {
    const { note, project } = context;

    // Get current key signature at this time point
    const keySignature = getCurrentKeySignature(
      project.metadata.keySignatures,
      note.ticks
    );

    if (!keySignature) {
      // No key signature = allow all notes
      return Result.ok(undefined);
    }

    // Get scale notes using Tonal
    const scaleName = `${keySignature.key} ${keySignature.scale}`;
    const scale = Scale.get(scaleName);

    if (!scale.notes || scale.notes.length === 0) {
      return Result.err([{
        type: 'scale',
        message: 'Could not determine scale',
        technicalReason: `Invalid scale: ${scaleName}`
      }]);
    }

    // Convert MIDI note to pitch class (modulo 12)
    const pitchClass = note.midi % 12;

    // Convert MIDI to note name (handles enharmonics)
    const noteName = Note.fromMidi(note.midi);
    const noteWithoutOctave = Note.pitchClass(noteName);

    // Check if pitch class is in scale
    const isInScale = scale.notes.some(scaleNote => {
      const scalePC = Note.chroma(scaleNote);
      return scalePC === pitchClass;
    });

    if (!isInScale) {
      return Result.err([{
        type: 'scale',
        message: `${noteWithoutOctave} is not in ${scaleName} scale`,
        technicalReason: `MIDI ${note.midi} (pitch class ${pitchClass}) not in scale: ${scale.notes.join(', ')}`,
        affectedNote: note
      }]);
    }

    return Result.ok(undefined);
  }
}

function getCurrentKeySignature(
  keySignatures: HaydnKeySignature[],
  ticks: number
): HaydnKeySignature | null {
  // Find the most recent key signature before this tick
  return keySignatures
    .filter(ks => ks.ticks <= ticks)
    .sort((a, b) => b.ticks - a.ticks)[0] || null;
}
```

### Pattern 3: Genre-Specific Validation Configuration

**What:** Define genre rules as data rather than code, enable runtime genre switching

**When to use:** For supporting multiple genres with different harmonic/melodic constraints

**Example:**
```typescript
// Source: Genre classification research patterns
// https://www.tandfonline.com/doi/full/10.1080/09540090902733780

interface GenreRules {
  name: string;
  allowedScales: string[];           // e.g., ["minor", "harmonic minor", "phrygian"]
  preferredIntervals: number[];      // Semitone intervals
  avoidedIntervals: number[];        // e.g., tritone (6) for some genres
  allowedChordTypes: string[];       // e.g., ["minor", "minor 7", "dominant 7"]
  progressionRules?: {
    allowedTransitions: Map<string, string[]>; // Roman numeral transitions
  };
}

const TRAP_RULES: GenreRules = {
  name: 'trap',
  allowedScales: ['minor', 'harmonic minor', 'phrygian', 'locrian'],
  preferredIntervals: [1, 3, 6],  // minor 2nd, minor 3rd, tritone
  avoidedIntervals: [4, 7, 11],   // major 3rd, perfect 5th, major 7th
  allowedChordTypes: ['minor', 'minor 7', 'dominant 7', 'diminished'],
};

const JAZZ_RULES: GenreRules = {
  name: 'jazz',
  allowedScales: ['major', 'dorian', 'mixolydian', 'altered', 'diminished'],
  preferredIntervals: [4, 7, 10, 11],  // 3rds, 7ths
  avoidedIntervals: [],
  allowedChordTypes: ['major 7', 'minor 7', 'dominant 7', 'diminished 7', 'half-diminished 7'],
  progressionRules: {
    allowedTransitions: new Map([
      ['I', ['ii', 'iii', 'IV', 'V', 'vi']],
      ['ii', ['V', 'vii°']],
      ['V', ['I', 'vi']],
    ])
  }
};

class GenreValidator implements Validator {
  constructor(private rules: GenreRules) {}

  validate(context: ValidationContext): ValidationResult {
    // Check if intervals fit genre expectations
    // This is a warning, not a hard error
    const errors: ValidationError[] = [];

    // Check against previous note to see interval
    const previousNote = getPreviousNote(context);
    if (previousNote) {
      const interval = Math.abs(context.note.midi - previousNote.midi) % 12;

      if (this.rules.avoidedIntervals.includes(interval)) {
        errors.push({
          type: 'genre',
          message: `Interval sounds unusual for ${this.rules.name} style`,
          technicalReason: `Interval ${interval} semitones avoided in ${this.rules.name}`,
          affectedNote: context.note
        });
      }
    }

    return errors.length > 0 ? Result.err(errors) : Result.ok(undefined);
  }
}
```

### Pattern 4: Transition Smoothness Validation

**What:** Detect scale/key context around edit point, ensure new notes don't create jarring changes

**When to use:** For validating edits that occur near existing musical content

**Example:**
```typescript
// Source: Key detection and smooth transitions research
// https://www.researchgate.net/publication/220723255_Detection_of_Key_Change_in_Classical_Piano_Music

import { Scale, Chord } from 'tonal';

class TransitionValidator implements Validator {
  validate(context: ValidationContext): ValidationResult {
    const { note, track } = context;

    // Get notes in temporal neighborhood (e.g., ±2 beats)
    const neighborhoodNotes = getNotesInTimeWindow(
      track.notes,
      note.ticks,
      context.project.metadata.ppq * 2 // 2 beats
    );

    if (neighborhoodNotes.length === 0) {
      // No context to validate against
      return Result.ok(undefined);
    }

    // Detect scale from surrounding notes
    const midiNotes = neighborhoodNotes.map(n => n.midi);
    const noteNames = midiNotes.map(midi => Note.fromMidi(midi));
    const detectedScales = Scale.detect(noteNames);

    if (detectedScales.length === 0) {
      // Can't determine context
      return Result.ok(undefined);
    }

    // Check if new note fits detected scales
    const newNoteName = Note.fromMidi(note.midi);
    const newNotePitchClass = Note.pitchClass(newNoteName);

    const fitsAnyScale = detectedScales.some(scaleName => {
      const scale = Scale.get(scaleName);
      return scale.notes.includes(newNotePitchClass);
    });

    if (!fitsAnyScale) {
      return Result.err([{
        type: 'transition',
        message: `This note may create a jarring transition (surrounding music suggests ${detectedScales[0]})`,
        technicalReason: `Note ${newNotePitchClass} not found in detected scales: ${detectedScales.join(', ')}`,
        affectedNote: note
      }]);
    }

    return Result.ok(undefined);
  }
}

function getNotesInTimeWindow(
  notes: HaydnNote[],
  centerTicks: number,
  windowTicks: number
): HaydnNote[] {
  return notes.filter(n =>
    Math.abs(n.ticks - centerTicks) <= windowTicks &&
    n.ticks !== centerTicks // Exclude the note being validated
  );
}
```

### Anti-Patterns to Avoid

- **Hard-coding scale note arrays:** Use Tonal.js instead - handles modes, exotic scales, edge cases
- **String comparison for enharmonic equivalence:** B# and C are different strings but same pitch - use pitch class (chroma)
- **Throwing exceptions for validation failures:** Use Result types to make errors part of the type system
- **Validating on every render:** Validate on edit actions only, cache results in state
- **Global key signature assumption:** Projects may have key changes - always check signature at specific tick position
- **Octave-insensitive validation when octave matters:** For voice leading, octave matters; for scale membership, use pitch class

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scale note calculation | Custom interval math | Tonal.js Scale.get() | Handles modes, exotic scales, double sharps/flats, over 100 scales defined |
| Chord detection from notes | Pattern matching | @tonaljs/chord-detect | Handles inversions, extensions, sus chords, 40+ chord types |
| MIDI to note name | Lookup table | @tonaljs/note Note.fromMidi() | Handles enharmonic context, octave numbering standards |
| Enharmonic equivalence | String normalization | Note.chroma() for pitch class | B# ≠ "C" as strings, but chroma handles correctly |
| Roman numeral analysis | Regex parsing | @tonaljs/progression or music21 RomanText | Handles secondary dominants, borrowed chords, figured bass |
| Interval calculation | Subtraction | @tonaljs/interval | Handles augmented/diminished, compound intervals, direction |

**Key insight:** Music theory has centuries of edge cases (double flats, enharmonic spellings, modal mixture, etc.). Libraries encode this knowledge; custom implementations miss subtle rules and create maintenance burden.

## Common Pitfalls

### Pitfall 1: Enharmonic Equivalence Confusion

**What goes wrong:** Validation incorrectly rejects F# in a G major scale because it's checking for "Gb" string

**Why it happens:** MIDI note numbers map to 12 pitch classes but infinite possible spellings (F#, Gb, E##, etc.)

**How to avoid:**
- Use `Note.chroma()` to get pitch class number (0-11) for comparison
- Only use note names for display/error messages
- Store pitch class sets as numbers, not strings

**Warning signs:**
- Validation results differ based on how user input note name
- Same MIDI number passes/fails in different contexts
- String equality checks on note names

### Pitfall 2: Octave Designation Standard Mismatch

**What goes wrong:** Middle C (MIDI 60) treated as C3 in one context, C4 in another, causing off-by-octave errors

**Why it happens:** Multiple standards exist - some call middle C "C3", others "C4", MIDI spec doesn't mandate

**How to avoid:**
- Use MIDI note numbers (0-127) as source of truth
- Convert to names only for display using consistent library (Tonal)
- Document which standard you follow (recommend: Middle C = C4 = MIDI 60)

**Warning signs:**
- Octave numbers inconsistent between components
- Off-by-12 errors in MIDI conversion
- User confusion about octave numbering

### Pitfall 3: Key Signature Timing Assumptions

**What goes wrong:** Validator uses project's initial key signature for all edits, missing mid-song key changes

**Why it happens:** Assuming global key signature instead of time-based lookup

**How to avoid:**
- Always pass `ticks` timestamp to key signature lookup
- Sort key signatures by time, return most recent before edit point
- Handle case where no key signature exists (chromatic/atonal music)

**Warning signs:**
- Validation works at song start but fails later
- Modulations cause incorrect rejections
- Users can't edit in different keys within same project

### Pitfall 4: Validation UX Blocking Experimentation

**What goes wrong:** Strict validation prevents users from intentionally breaking rules for creative effect

**Why it happens:** Treating all validation as hard errors instead of warnings/suggestions

**How to avoid:**
- Distinguish hard errors (technical impossibility) from soft warnings (style suggestion)
- Provide "override" mechanism for intentional rule-breaking
- Genre rules should be suggestions, scale violations might be errors (depending on context)

**Warning signs:**
- Users complain they "can't do X" when it's musically valid
- Workarounds to bypass validation
- Feature requests for "disable validation" toggle

### Pitfall 5: Chord Progression Validation Without Context

**What goes wrong:** Rejecting valid jazz chord progression because it doesn't follow classical rules

**Why it happens:** Applying universal harmonic rules to genre-specific contexts

**How to avoid:**
- Make genre a first-class parameter in validation
- Different genres have different harmonic vocabularies
- Provide genre presets but allow customization
- Default to permissive if genre unknown

**Warning signs:**
- Jazz/trap producers report "wrong" validation errors
- Classical rules applied to modern genres
- Users in different genres have opposite feedback

### Pitfall 6: Pitch Class vs Pitch Confusion

**What goes wrong:** Voice leading analysis treats all Cs as equivalent, ignoring octave displacement

**Why it happens:** Using modulo 12 pitch class when absolute pitch matters

**How to avoid:**
- Use pitch class (midi % 12) for scale membership
- Use full MIDI number for voice leading, intervallic distance
- Document which concept applies to each validation

**Warning signs:**
- Octave jumps not detected as unusual
- Voice leading validation accepts awkward register changes
- Interval validation incorrectly flags octave-displaced notes

## Code Examples

Verified patterns from official sources:

### Check if Note is in Scale
```typescript
// Source: @tonaljs/scale documentation
// https://www.npmjs.com/package/@tonaljs/scale

import { Scale, Note } from 'tonal';

function isNoteInScale(midiNote: number, scaleName: string): boolean {
  const scale = Scale.get(scaleName);
  if (!scale.notes || scale.notes.length === 0) {
    return false; // Invalid scale
  }

  // Get pitch class of MIDI note
  const noteName = Note.fromMidi(midiNote);
  const pitchClass = Note.pitchClass(noteName);

  // Check if pitch class appears in scale
  return scale.notes.includes(pitchClass);
}

// Usage:
isNoteInScale(60, "C major");     // true (C)
isNoteInScale(61, "C major");     // false (C#/Db)
isNoteInScale(64, "C major");     // true (E)
```

### Detect Scale from Notes
```typescript
// Source: Tonal.js GitHub examples
// https://github.com/tonaljs/tonal/issues/36

import { Scale, Note } from 'tonal';

function detectScalesFromMIDI(midiNotes: number[]): string[] {
  // Convert MIDI to note names
  const noteNames = midiNotes.map(midi => Note.fromMidi(midi));

  // Detect possible scales
  return Scale.detect(noteNames);
}

// Usage:
detectScalesFromMIDI([60, 62, 64, 65, 67, 69, 71]);
// Returns: ["C major", "C ionian", "D dorian", ...]
```

### Build Validation Result
```typescript
// Source: Result monad patterns
// https://github.com/thames-technology/monads

import { Result } from '@thames/monads';

interface NoteValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateNoteEdit(
  note: HaydnNote,
  context: ValidationContext
): Result<void, ValidationError[]> {
  const errors: ValidationError[] = [];

  // Run validators
  const scaleResult = new ScaleValidator().validate(context);
  if (scaleResult.isErr()) {
    errors.push(...scaleResult.error);
  }

  const genreResult = new GenreValidator(TRAP_RULES).validate(context);
  if (genreResult.isErr()) {
    // Genre violations are warnings, not errors
    console.warn('Genre style suggestion:', genreResult.error);
  }

  return errors.length > 0
    ? Result.err(errors)
    : Result.ok(undefined);
}

// Usage in edit action:
const validationResult = validateNoteEdit(newNote, context);

if (validationResult.isErr()) {
  // Show error to user
  showValidationErrors(validationResult.error);
  return; // Don't apply edit
}

// Apply edit
applyNoteEdit(newNote);
```

### Convert MIDI to Pitch Class
```typescript
// Source: Pitch class theory
// https://dobrian.github.io/cmp/topics/basics-of-music-theory/5.representing-pitch.html

const PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToPitchClass(midiNote: number): number {
  return midiNote % 12;
}

function pitchClassToName(pitchClass: number): string {
  return PITCH_CLASS_NAMES[pitchClass];
}

function midiToPitchClassName(midiNote: number): string {
  return pitchClassToName(midiToPitchClass(midiNote));
}

// Usage:
midiToPitchClass(60);      // 0 (C)
midiToPitchClass(61);      // 1 (C#)
midiToPitchClassName(73);  // "C#" (MIDI 73 = C#5)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Teoria.js for music theory | Tonal.js | ~2020 | Better TypeScript support, modular packages, functional API |
| Exceptions for validation | Result/Either types | 2023-2024 | Type-safe error handling, better composition |
| Hard-coded validation rules | Configuration-driven validators | Ongoing trend | Easier to customize per-genre, test, maintain |
| Global validation | Context-aware validation | Recent best practice | Handles key changes, modulations, complex arrangements |

**Deprecated/outdated:**
- **Teoria.js:** Last significant update 2018, lacks TypeScript types, not modular
- **music-theory-js (Pomax):** Archived, unmaintained since 2019
- **String-based note comparison:** Replaced by pitch class (chroma) comparison for enharmonic equivalence

## Open Questions

Things that couldn't be fully resolved:

1. **Functional Harmony Validation for Complex Progressions**
   - What we know: Roman numeral analysis exists (music21 RomanText format), Tonal has progression utilities
   - What's unclear: No production-ready JavaScript library for validating II-V-I, secondary dominants, borrowed chords
   - Recommendation: Start with simple tonic/dominant/subdominant validation, expand based on genre needs. Consider music21 API if deep analysis required.

2. **Genre Classification Threshold**
   - What we know: Genres have characteristic scales/chords/intervals
   - What's unclear: How strict should genre validators be? Trap music "mostly" uses minor scales but not exclusively
   - Recommendation: Implement genre rules as warnings/suggestions, not hard errors. Let user configure strictness.

3. **Real-time Performance Impact**
   - What we know: Validation must run on every note edit
   - What's unclear: Performance impact of running multiple validators on large arrangements
   - Recommendation: Implement debouncing, validate only affected notes, profile with realistic projects. Consider Web Workers for heavy analysis.

4. **Voice Leading Rules**
   - What we know: Classical voice leading has strict rules (parallel fifths, voice crossing, range)
   - What's unclear: Whether trap/EDM producers care about these rules, how to make optional
   - Recommendation: Phase 4 focuses on scale/harmony validation. Defer voice leading to future phase if needed.

5. **User Control Over Validation Strictness**
   - What we know: Users need override capability for creative rule-breaking
   - What's unclear: UI/UX for toggling validators on/off, per-genre presets, custom rules
   - Recommendation: Implement core validation engine in Phase 4, defer UI controls to Phase 5 (settings/preferences).

## Sources

### Primary (HIGH confidence)
- Tonal.js GitHub Repository - https://github.com/tonaljs/tonal
- @tonaljs/scale npm package (v4.13.3) - https://www.npmjs.com/package/@tonaljs/scale
- Tonal.js Documentation - https://tonaljs.github.io/tonal/docs
- MIDI Note/Pitch Representation (dobrian) - https://dobrian.github.io/cmp/topics/basics-of-music-theory/5.representing-pitch.html
- MIDI.org Octave Numbering Standard - https://midi.org/community/midi-specifications/midi-octave-and-note-numbering-standard

### Secondary (MEDIUM confidence)
- Express-validator validation chain concepts - https://express-validator.github.io/docs/guides/validation-chain/
- @thames/monads Result/Either types - https://github.com/thames-technology/monads
- Music genre classification research - https://www.tandfonline.com/doi/full/10.1080/09540090902733780
- Trap beat melody scales - https://www.productionmusiclive.com/blogs/news/trap-beat-guide-melodies-3-essential-scales-for-making-melodies
- Key detection research - https://www.researchgate.net/publication/220723255_Detection_of_Key_Change_in_Classical_Piano_Music
- Functional harmony theory - https://www.artofcomposing.com/08-diatonic-harmony

### Tertiary (LOW confidence)
- When-in-Rome Roman numeral library (Python-focused) - https://github.com/MarkGotham/When-in-Rome
- NestJS validation pipes patterns - https://www.devcentrehouse.eu/blogs/nestjs-dtos-pipes-scalable-backend-apps/
- Music theory error messages discussion - https://medium.com/@davmandy_jp/a-music-theory-overhaul-bea102406ac6

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tonal.js is clearly the standard, verified through multiple sources
- Architecture: MEDIUM-HIGH - Validation pipeline patterns well-established, music-specific patterns based on research + reasoning
- Pitfalls: HIGH - MIDI/pitch class pitfalls documented in standards, enharmonic issues verified

**Research date:** 2026-01-30
**Valid until:** ~2026-03-30 (30 days for stable ecosystem, Tonal.js is mature)

**Notes:**
- Tonal.js last published 7 months ago (June 2025), stable API
- No major alternatives emerging in 2026 search results
- Genre-specific validation is custom domain logic, not library-provided
- Functional harmony validation may require future enhancement if complex progressions needed
