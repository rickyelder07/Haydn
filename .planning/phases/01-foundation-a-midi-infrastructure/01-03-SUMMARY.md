---
phase: 01-foundation-a-midi-infrastructure
plan: 03
subsystem: musicxml
tags: [musicxml, musicxml-interfaces, parser, converter, midi-conversion]

# Dependency graph
requires:
  - phase: 01-01
    provides: HaydnProject types and data structures
provides:
  - MusicXML file parsing (.musicxml/.xml)
  - MusicXML to HaydnProject conversion
  - Part-to-track mapping
  - Divisions-to-ticks timing conversion
affects: [file-import, ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MusicXML divisions to MIDI ticks conversion
    - Graceful handling of partial MusicXML support
    - Chord note detection (same tick position)

key-files:
  created:
    - src/lib/musicxml/parser.ts
    - src/lib/musicxml/converter.ts
    - src/types/musicxml-interfaces.d.ts
  modified: []

key-decisions:
  - "Use musicxml-interfaces library for parsing"
  - "Support uncompressed XML only (v1 scope)"
  - "Convert divisions-based timing to MIDI ticks using PPQ=480"
  - "Default velocity to 0.8 for all notes"

patterns-established:
  - "Pattern 1: Validate file before parsing"
  - "Pattern 2: Convert to internal types early, work with HaydnProject throughout"
  - "Pattern 3: Graceful degradation for unsupported MusicXML features"

# Metrics
duration: 136 seconds
completed: 2026-01-24
---

# Phase 01 Plan 03: MusicXML Parser & Converter Summary

**MusicXML parsing with musicxml-interfaces converting parts to HaydnTracks with divisions-to-ticks timing**

## Performance

- **Duration:** 2 min 16 sec
- **Started:** 2026-01-24T17:45:17Z
- **Completed:** 2026-01-24T17:47:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- MusicXML file parsing with validation (.musicxml, .xml extensions)
- Complete conversion pipeline from MusicXML parts to HaydnProject format
- Metadata extraction (tempo, time signature, key signature)
- Pitch-to-MIDI note number conversion (C4 = 60)
- Divisions-based timing converted to MIDI ticks
- Chord detection and handling (multiple notes at same tick position)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MusicXML parser** - `8a8e756` (feat)
2. **Task 2: Create MusicXML to HaydnProject converter** - `60be639` (feat)

## Files Created/Modified

**Created:**
- `src/lib/musicxml/parser.ts` - Parses and validates MusicXML files using musicxml-interfaces
- `src/lib/musicxml/converter.ts` - Converts parsed MusicXML to HaydnProject format
- `src/types/musicxml-interfaces.d.ts` - TypeScript declarations for musicxml-interfaces library

**Modified:** None

## Decisions Made

### 1. MusicXML Library Selection
**Decision:** Use musicxml-interfaces for parsing.
**Rationale:** Well-typed, actively maintained, handles both partwise and timewise formats.
**Impact:** TypeScript declarations needed for proper type support.
**Location:** `src/lib/musicxml/parser.ts`

### 2. Uncompressed XML Only (v1 Scope)
**Decision:** Support .musicxml and .xml files only, not compressed .mxl.
**Rationale:** Simplify v1 implementation. Most notation software exports uncompressed XML as an option.
**Impact:** Users must export uncompressed MusicXML from notation software.
**Location:** `src/lib/musicxml/parser.ts` - `validateMusicXmlFile()`

### 3. Default PPQ for Converted Files
**Decision:** Use PPQ=480 for MusicXML conversions.
**Rationale:** Standard MIDI resolution, matches typical MIDI file exports.
**Impact:** MusicXML divisions converted to ticks using this fixed PPQ.
**Location:** `src/lib/musicxml/converter.ts` - `DEFAULT_PPQ = 480`

### 4. Default Velocity Handling
**Decision:** Set all note velocities to 0.8 (normalized).
**Rationale:** MusicXML dynamics are complex (text, symbols, hairpins). Full conversion out of v1 scope.
**Impact:** All imported notes have same velocity. No dynamic variation preserved.
**Location:** `src/lib/musicxml/converter.ts` - `convertPartToTrack()`

### 5. Partwise-Only Conversion (v1)
**Decision:** Support ScorePartwise format only, not ScoreTimewise.
**Rationale:** Partwise is the most common export format (MuseScore, Finale, Sibelius default).
**Impact:** Timewise scores return empty project. Can be extended in future.
**Location:** `src/lib/musicxml/converter.ts` - `convertMusicXmlToProject()`

## Deviations from Plan

None - plan executed exactly as written.

## Technical Context

### MusicXML to HaydnProject Mapping

**Parts → Tracks:**
- Each MusicXML `<part>` becomes a `HaydnTrack`
- Part names from `<score-part>` become track names
- Sequential channel assignment (index % 16)
- Default instrument: Piano (program 0)

**Notes → HaydnNotes:**
- Pitch: `<step><alter><octave>` → MIDI note number (C4 = 60)
- Duration: MusicXML divisions → MIDI ticks via `duration * (ppq / divisions)`
- Chord notes: `<chord/>` element → same tick position as previous note
- Rests: Advance tick position but don't create notes

**Metadata Extraction:**
- **Tempo:** From `<direction><sound tempo="120"/>`
- **Time Signature:** From `<attributes><time beats="4" beat-type="4"/>`
- **Key Signature:** From `<attributes><key fifths="0" mode="major"/>` → Key name via fifths mapping

**Divisions to Ticks Conversion:**
```
MusicXML: duration in divisions (per quarter note)
MIDI:     ticks in PPQ (per quarter note)
Formula:  ticks = duration × (PPQ / divisions)
```

Example: If divisions=480 and PPQ=480, then duration=480 → 480 ticks (one quarter note).

### Supported MusicXML Features (v1)

**Fully Supported:**
- ✅ Part names
- ✅ Note pitch (step, alter, octave)
- ✅ Note duration (divisions-based)
- ✅ Chord notes (simultaneous pitches)
- ✅ Rests (timing advance)
- ✅ Tempo (from direction/sound)
- ✅ Time signature (beats, beat-type)
- ✅ Key signature (fifths, mode)

**Not Supported (v1 scope):**
- ❌ Dynamics (all notes default to velocity 0.8)
- ❌ Articulations (staccato, accent, etc.)
- ❌ Slurs/ties (notes imported as separate)
- ❌ Compressed MusicXML (.mxl files)
- ❌ Timewise scores (only partwise)
- ❌ Repeats, codas, segnos
- ❌ Lyrics, text annotations

### Edge Case Handling

**Empty/Invalid Files:**
- Returns empty HaydnProject with default metadata
- No crash, graceful degradation

**Missing Metadata:**
- Tempo: Defaults to 120 BPM
- Time signature: Defaults to 4/4
- Key signature: No default (empty array)

**Chord Detection:**
- `<chord/>` element indicates note is part of chord
- Chord notes get same tick position as previous note
- Tick position doesn't advance for chord notes

## Verification Results

All success criteria met:
- ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
- ✅ Parser validates file extension (.musicxml, .xml)
- ✅ Parser handles XML parsing errors gracefully
- ✅ Returns ParseResult with success/error
- ✅ Converter produces HaydnProject with proper structure
- ✅ Part names become track names
- ✅ Notes have correct MIDI pitch numbers
- ✅ Timing converted to ticks using divisions
- ✅ Tempo and time signature extracted
- ✅ Chord notes handled correctly (same start time)

## Next Phase Readiness

**Ready for:**
- ✅ File upload UI to accept .musicxml and .xml files
- ✅ Import workflow alongside MIDI files
- ✅ Track list rendering (uses same HaydnProject structure)

**Blockers:** None

**Concerns:**
- Velocity defaulting to 0.8 means all notes have same volume (acceptable for v1)
- Future versions may need full dynamics conversion

## Notes

**MusicXML Complexity:**
MusicXML is a rich format with hundreds of features. This implementation captures the essential subset needed for MIDI editing: pitch, timing, structure. Full MusicXML support (articulations, dynamics, notation-specific features) would require significantly more work and is out of scope for v1.

**Why This Subset Works:**
For Haydn's use case (natural language MIDI editing), we need:
1. Note pitch and timing ✅
2. Track structure ✅
3. Tempo and meter ✅

Notation-specific features (slurs, articulations, dynamics) are less critical for programmatic editing and can be added incrementally.

---
*Phase: 01-foundation-a-midi-infrastructure*
*Completed: 2026-01-24*
