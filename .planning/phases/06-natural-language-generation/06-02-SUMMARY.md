---
phase: 06-natural-language-generation
plan: 02
subsystem: music-generation
tags: [tonal, music-theory, midi, rule-based-generation, chord-progressions, drum-patterns, melody-generation, bass-lines]

# Dependency graph
requires:
  - phase: 01-foundation-a-midi-infrastructure
    provides: HaydnNote type, MIDI infrastructure for note representation
  - phase: 04-music-theory-validation-layer
    provides: Tonal.js integration patterns, scale/chord utilities
provides:
  - Rule-based music generators (chords, drums, melody, bass)
  - Genre templates with musical conventions for 6 genres
  - Pure functions that convert structured params to MIDI notes
  - ChordSymbol type for downstream generator coordination
affects: [06-03, phase-06-remaining-plans, natural-language-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Genre template data objects for musical conventions"
    - "Pure function generators with no side effects"
    - "Weighted random walk for melody generation"
    - "Tonal.js Progression.fromRomanNumerals for chord-in-key conversion"

key-files:
  created:
    - src/lib/nl-generation/genreTemplates.ts
    - src/lib/nl-generation/chordGenerator.ts
    - src/lib/nl-generation/rhythmGenerator.ts
    - src/lib/nl-generation/melodyGenerator.ts
    - src/lib/nl-generation/bassGenerator.ts
  modified: []

key-decisions:
  - "Tonal.js Note.transpose for interval calculation (not Interval.transpose)"
  - "Genre templates use 5 section types (verse, chorus, bridge, intro, outro)"
  - "Walking bass uses chromatic approach note to next chord root"
  - "Melody prefers chord tones on strong beats (70% vs 50% probability)"
  - "Arousal modifies drum density and note count dynamically"
  - "Classical genre returns empty drum array (no percussion)"

patterns-established:
  - "DrumPattern with tick offsets at PPQ=480 for precise rhythm definition"
  - "ChordSymbol type carries timing info to melody/bass generators"
  - "Stepwise preference via closest-MIDI-note selection from candidates"
  - "Velocity variation applied via random factor within genre-defined range"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase 06 Plan 02: Rule-Based Music Generators Summary

**Five pure-function generators produce MIDI notes from structured parameters using Tonal.js for music theory: genre templates, chord progressions, drum patterns, melodic lines with weighted random walk, and bass lines with three rhythm styles**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-05T21:12:16Z
- **Completed:** 2026-02-05T21:16:24Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- 6 genre templates (lofi, trap, boom-bap, jazz, classical, pop) with chord progressions, drum patterns, instrument mappings, melody/bass configs
- Chord generator converts roman numerals to MIDI voicings using Tonal.js Progression.fromRomanNumerals
- Drum generator produces genre-appropriate patterns on channel 9 with arousal modifiers
- Melody generator creates melodic lines using weighted random walk preferring chord tones on strong beats
- Bass generator follows chord roots with three styles (root-notes, walking, arpeggiated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create genre templates and chord generator** - `aa4e51f` (feat)
2. **Task 2: Create rhythm, melody, and bass generators** - `e9fc511` (feat)

## Files Created/Modified

- `src/lib/nl-generation/genreTemplates.ts` - Genre-specific musical templates (chord progressions, drum patterns, instrumentation, melody/bass configs) for 6 genres
- `src/lib/nl-generation/chordGenerator.ts` - Converts roman numeral progressions to HaydnNote arrays using Tonal.js, returns chord symbols for downstream generators
- `src/lib/nl-generation/rhythmGenerator.ts` - Generates drum tracks from genre templates with arousal-based density modifiers, all notes on channel 9
- `src/lib/nl-generation/melodyGenerator.ts` - Creates melodic lines using weighted random walk (70% chord tones on strong beats, 50% otherwise), stepwise preference, scale conformance
- `src/lib/nl-generation/bassGenerator.ts` - Follows chord roots with three rhythm styles (root-notes sustain, walking bass with chromatic approach, arpeggiated 8th notes)

## Decisions Made

- **Tonal.js Note.transpose for interval calculation:** The `transpose` function is on the Note module, not Interval module. Used `Note.transpose(rootNote, interval)` for walking bass 3rd/5th calculation.

- **Genre templates use 5 section types:** verse, chorus, bridge, intro, outro. Each genre defines progressions and drum patterns for all 5 sections with fallback to verse if section type not found.

- **Walking bass chromatic approach:** Last beat of final bar in chord uses note one semitone below next chord root for smooth voice leading.

- **Melody chord-tone preference on strong beats:** Beats 1 and 3 use 70% chord tone probability (vs 50% on weak beats) for stronger harmonic grounding.

- **Arousal modifies density dynamically:** High arousal (>0.3) adds extra kick hits on 8th subdivisions. Low arousal (<-0.3) reduces hi-hats to quarter notes only. Melody notesPerBar interpolates between min/max based on arousal.

- **Classical genre returns empty drums:** Genre template has empty kick/snare/hihat arrays, generateDrumTrack returns empty array for classical.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Tonal.js API usage for Note.transpose**
- **Found during:** Task 2 (bassGenerator.ts implementation)
- **Issue:** Used `Interval.transpose(rootNote, interval)` but transpose method is on Note module, not Interval
- **Fix:** Changed imports to remove Interval, updated calls to `Note.transpose(rootNote, interval)`
- **Files modified:** src/lib/nl-generation/bassGenerator.ts
- **Verification:** TypeScript compilation passed after fix
- **Committed in:** e9fc511 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for correct Tonal.js API usage. No scope creep.

## Issues Encountered

None - all generators implemented as specified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Rule-based generators complete and ready for integration
- Next plan should create orchestrator that combines LLM parameter extraction (06-01) with these generators
- All generators are pure functions with no side effects - easy to test and compose
- ChordSymbol type provides timing coordination between generators
- Genre templates can be extended with new genres without code changes

---
*Phase: 06-natural-language-generation*
*Completed: 2026-02-05*
