---
phase: 04-music-theory-validation-layer
plan: 01
subsystem: music-theory-foundation
tags: [tonal.js, validation, types, pitch-class, key-signature]
requires: [03-piano-roll-editor]
provides: [validation-types, pitch-utilities, key-lookup]
affects: [04-02, 04-03, 04-04, 04-05, 04-06]
tech-stack:
  added: [tonal@5.0.7]
  patterns: [discriminated-unions, enharmonic-safe-comparison, time-aware-lookup]
key-files:
  created:
    - src/lib/music-theory/types.ts
    - src/lib/music-theory/pitchClass.ts
    - src/lib/music-theory/keySignature.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - id: tonal-main-package
    title: Use main tonal package (not individual @tonaljs/* subpackages)
    rationale: Simpler dependency management, re-exports everything needed
  - id: discriminated-union-result
    title: Use discriminated union for Result type (no library)
    rationale: Simple { ok: true } | { ok: false; errors: [] } pattern, no need for fp-ts or monads library
  - id: chroma-based-comparison
    title: Use Note.chroma() for pitch class comparison
    rationale: Avoids enharmonic equivalence issues (F# vs Gb both have chroma 6)
  - id: permissive-invalid-scale
    title: Return true/empty for invalid scales
    rationale: Don't block validation on missing/bad scale data, be permissive
metrics:
  duration: "1.7 min"
  completed: 2026-01-31
---

# Phase 04 Plan 01: Foundation Types & Utilities Summary

**One-liner:** Installed Tonal.js and created validation types with enharmonic-safe pitch class conversion and time-aware key signature lookup.

## What Was Built

This plan established the foundational types and utilities for the music theory validation layer:

1. **Validation Type System**: Created `ValidationError`, `ValidationResult` (discriminated union), `ValidationContext`, `Validator` interface, `GenreRules`, and `NoteConformance` types
2. **Pitch Class Utilities**: Implemented 6 functions for MIDI-to-pitch conversion using Tonal.js with enharmonic-safe comparison via `Note.chroma()`
3. **Key Signature Lookup**: Time-aware key signature resolution that finds the active key signature at any tick position

## Technical Implementation

### Files Created

**src/lib/music-theory/types.ts**
- ValidationError with severity, user-friendly message, technical detail, and affected MIDI
- ValidationResult as discriminated union (no external library dependency)
- ValidationContext provides note, track, project, and editType to all validators
- Validator interface ensures consistent validate() signature
- GenreRules configuration for data-driven genre constraints
- NoteConformance for visual feedback (piano roll highlighting)

**src/lib/music-theory/pitchClass.ts**
- `midiToPitchClass(midi)`: Returns 0-11 pitch class
- `midiToNoteName(midi)`: Returns "C4", "F#5" format using Note.fromMidi()
- `midiToPitchClassName(midi)`: Returns "C", "F#" without octave
- `isNoteInScale(midi, scaleName)`: Enharmonic-safe scale membership check
- `getScaleNotes(scaleName)`: Returns pitch class array [0,2,4,5,7,9,11]
- `getScalePitchClasses(key, scale)`: Convenience Set builder for fast lookup

**src/lib/music-theory/keySignature.ts**
- `getCurrentKeySignature(keySignatures, ticks)`: Finds most recent key signature at or before tick position
- `getScaleAtTick(keySignatures, ticks)`: Combines key lookup with scale pitch class extraction

### Key Technical Decisions

**Enharmonic Safety**: All pitch class comparisons use `Note.chroma()` instead of string comparison. This prevents false negatives when comparing F# (chroma 6) vs Gb (chroma 6) - they're the same pitch class despite different names.

**Permissive Fallbacks**: Invalid or empty scales return true/empty rather than throwing errors. This prevents validation from blocking edits when project metadata is missing or malformed.

**Time-Aware Lookup**: Key signature lookup sorts by ticks descending and finds the first entry where `ks.ticks <= ticks`, matching how MIDI key signature events work (they affect all subsequent notes until the next key change).

**No External Result Library**: Uses simple discriminated union `{ ok: true } | { ok: false; errors: ValidationError[] }` instead of fp-ts or monads library. Reduces dependencies and complexity for a straightforward Result pattern.

## Dependencies Installed

- **tonal@5.0.7**: Main tonal package providing Scale and Note utilities
  - Includes Note.fromMidi(), Note.chroma(), Note.pitchClass()
  - Includes Scale.get() for scale note extraction
  - 29 packages added (tonal sub-dependencies)

## Verification Results

✅ All verification criteria passed:
- `npx tsc --noEmit` - No type errors
- `npm run build` - Build successful (Next.js 15.5.9, static pages generated)
- `node -e "require('tonal').Scale.get('C major').notes"` - Returns ['C','D','E','F','G','A','B']
- All type exports resolve correctly
- Utility functions use chroma-based comparison (not string equality)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 94ef147 | Install Tonal.js and create validation types |
| 2 | e71f8ed | Create pitch class and key signature utilities |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 04-02 (Scale Validator)**

This plan provides all foundational types and utilities needed by subsequent validators:
- `ValidationResult` type for all validator return values
- `ValidationContext` type for all validator inputs
- `Validator` interface for consistent validator structure
- `isNoteInScale()` for scale conformance checking
- `getScaleAtTick()` for time-aware scale lookup

**Provides to downstream plans:**
- 04-02: Scale validator can use `isNoteInScale()` and `ValidationResult`
- 04-03: Progression validator can use pitch class utilities
- 04-04: Transition validator can use pitch class arithmetic
- 04-05: Genre validator can use `GenreRules` configuration
- 04-06: Integration can import all validators via `Validator` interface

**No blockers or concerns.**

## Lessons Learned

1. **Tonal.js API**: Note.chroma() is the canonical way to get pitch class (0-11) in a way that handles enharmonic equivalence correctly
2. **Scale.get() behavior**: Returns empty notes array for invalid scale names, making permissive fallback straightforward
3. **TypeScript path aliases**: @/lib/midi/types imports work seamlessly with tsconfig.json paths configuration
4. **Discriminated unions**: TypeScript narrows { ok: false } to have .errors property automatically, no runtime checking needed

## Performance Notes

- **Execution time**: 1.7 minutes (103 seconds)
- **Build time**: 2.2 seconds TypeScript compilation
- **Bundle impact**: Minimal - tonal utilities are tree-shakeable, only used functions included in bundle
- **No runtime performance concerns**: All functions are synchronous, deterministic, with O(n) complexity for scale lookups
