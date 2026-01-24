---
phase: 01-foundation-a-midi-infrastructure
plan: 02
subsystem: midi
tags: [midi, tonejs, validation, parsing, file-upload]

# Dependency graph
requires:
  - phase: 01-01
    provides: MIDI type system (HaydnProject, HaydnTrack, HaydnNote), GM instrument mapping
provides:
  - MIDI file validation (extension, size, header checks)
  - MIDI to HaydnProject parser wrapping @tonejs/midi
  - Auto-generated track names from instrument numbers
  - Preservation of all MIDI data (notes, control changes, metadata)
affects: [01-03-midi-export, 01-04-midi-state-management, file-upload-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File validation before parsing pattern (check header bytes)"
    - "ParseResult wrapper for consistent error handling"
    - "Auto-generated track names when source data missing"

key-files:
  created:
    - src/lib/midi/validator.ts
    - src/lib/midi/parser.ts
    - src/types/tonejs-midi.d.ts
  modified: []

key-decisions:
  - "Validate MIDI header bytes ('MThd') before parsing to provide clear error messages"
  - "10MB max file size to prevent browser memory issues"
  - "Normalize @tonejs/midi control change values (0-1) back to MIDI standard (0-127)"
  - "Auto-generate track names based on instrument when source MIDI has no track names"

patterns-established:
  - "ParseResult<T> pattern: { success: boolean, data?: T, error?: string }"
  - "Defensive validation: check in validator, double-check before parsing"
  - "Auto-naming pattern: '{instrumentName} Track' for unnamed tracks"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 01 Plan 02: MIDI Import Pipeline Summary

**MIDI file validation and parsing pipeline with @tonejs/midi wrapper, converting uploaded MIDI files to HaydnProject format with auto-generated track names**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-24T17:45:19Z
- **Completed:** 2026-01-24T17:47:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- MIDI file validator with extension, size, and magic byte header checks
- Full MIDI parser converting @tonejs/midi output to HaydnProject format
- Auto-generated track names based on GM instrument mapping
- Preservation of all MIDI data: notes, control changes, tempo, time signatures, key signatures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MIDI file validator** - `5e19a16` (feat)
2. **Task 2: Create MIDI parser with @tonejs/midi** - `48db5fc` (feat)

## Files Created/Modified
- `src/lib/midi/validator.ts` - File validation checking MIDI header bytes, extension, and size
- `src/lib/midi/parser.ts` - MIDI to HaydnProject conversion using @tonejs/midi
- `src/types/tonejs-midi.d.ts` - TypeScript declarations for @tonejs/midi library

## Decisions Made

**1. Validate MIDI header bytes before parsing**
- Provides clear error messages when users upload non-MIDI files
- Prevents cryptic parsing errors from @tonejs/midi
- Uses "MThd" magic bytes (0x4D 0x54 0x68 0x64)

**2. 10MB maximum file size**
- Prevents browser memory issues with very large MIDI files
- Reasonable limit for typical music production files

**3. Normalize control change values**
- @tonejs/midi returns CC values normalized to 0-1
- We convert back to MIDI standard 0-127 for internal representation
- Ensures consistency with MIDI spec throughout the app

**4. Auto-generate track names from instruments**
- When source MIDI has no track name, generate "{instrumentName} Track"
- Percussion tracks (channel 10) auto-named "Drums"
- Improves UX by avoiding "Track 1", "Track 2" etc.

## Deviations from Plan

**Auto-fixed Issue:**

**1. [Rule 3 - Blocking] Added @tonejs/midi type declarations**
- **Found during:** Task 2 (parser implementation)
- **Issue:** TypeScript couldn't resolve @tonejs/midi module - package lacks type definitions
- **Fix:** Created `src/types/tonejs-midi.d.ts` with minimal type declarations for Midi class and Track interface
- **Files modified:** src/types/tonejs-midi.d.ts (new file)
- **Verification:** TypeScript compilation passes without errors
- **Committed in:** 48db5fc (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking - type declarations)
**Impact on plan:** Type declarations necessary for TypeScript compilation. Standard practice for untyped libraries. No scope creep.

## Issues Encountered
None - plan executed smoothly with only type declarations needed for @tonejs/midi

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MIDI import pipeline complete and ready for MIDI export implementation (01-03)
- Parser produces fully populated HaydnProject objects with all metadata
- All track data preserved for accurate round-trip export
- Ready for state management integration (01-04)

---
*Phase: 01-foundation-a-midi-infrastructure*
*Completed: 2026-01-24*
