---
phase: 04-music-theory-validation-layer
plan: 04
type: summary
subsystem: ui-feedback
tags: [validation-ui, piano-roll, scale-visualization, user-feedback]
requires: [04-03]
provides:
  - Visual scale conformance feedback in piano roll
  - Validation error/warning display component
  - Theory control UI (toggle, genre selector, key display)
affects: [04-05, 04-06]
tech-stack:
  added: []
  patterns:
    - Auto-dismissing notifications for warnings
    - Persistent error banners for blocking validation
    - Row-based visual highlighting for scale membership
decisions:
  - scale-highlight-colors: In-scale rows use faint blue (rgba(59,130,246,0.06)), out-of-scale rows use faint red (rgba(239,68,68,0.04))
  - validation-feedback-placement: Between toolbar and canvas for immediate visibility
  - warning-auto-dismiss: 4-second timeout for warnings, manual dismiss only for errors
  - theory-controls-location: Inline with toolbar after zoom controls
  - scale-info-updates: Update on project/track/playhead changes
key-files:
  created:
    - src/components/PianoRoll/ValidationFeedback.tsx
    - src/components/PianoRoll/TheoryControls.tsx
  modified:
    - src/components/PianoRoll/PianoRollCanvas.tsx
    - src/components/PianoRoll/PianoRollEditor.tsx
metrics:
  duration: 3 minutes
  completed: 2026-01-31
---

# Phase 04 Plan 04: Visual Feedback and Theory Controls Summary

**One-liner:** Piano roll now highlights in-scale/out-of-scale rows with subtle tints, displays validation errors/warnings in dismissible banners, and provides theory controls (toggle, genre selector, key display) in the toolbar.

## What Was Built

### 1. Scale-Aware Row Highlighting (PianoRollCanvas)

Added visual feedback showing which piano roll rows conform to the current key/scale:

- **New prop:** `scalePitchClasses?: Set<number> | null`
- **In-scale rows:** Very faint blue tint (rgba(59, 130, 246, 0.06))
- **Out-of-scale rows:** Very faint red tint (rgba(239, 68, 68, 0.04))
- **Rendering:** Highlights drawn before grid lines but after background
- **Visibility:** Only when `scalePitchClasses` is provided and validation enabled
- **Subtlety:** Low alpha values prevent visual clutter, existing grid/notes/selection take priority

### 2. ValidationFeedback Component

Displays validation results from the validation pipeline:

**Features:**
- **Error banner (red):** Persistent until manually dismissed, shows first error with icon
- **Warning banner (amber):** Auto-dismisses after 4 seconds, shows first warning with icon
- **Dismiss button:** Manual close for both error and warning types
- **Null render:** Returns nothing when no validation results
- **Placement:** Between toolbar and main editor area for immediate visibility

**Implementation:**
- Reads `lastErrors`, `lastWarnings`, and `clearResult` from `useValidationStore`
- Auto-dismiss effect with `setTimeout` for warnings (errors exempt)
- SVG icons for error (circle with exclamation) and warning (triangle with exclamation)
- Tailwind styling with bg-red-900/50 for errors, bg-amber-900/50 for warnings

### 3. TheoryControls Component

Provides user control over music theory validation settings:

**Features:**
- **Validation toggle:** Button with visual indicator (green when enabled, gray when disabled)
- **Genre selector:** Dropdown with 5 presets (Classical, Jazz, Trap, Pop, None)
- **Key display:** Shows current scale name (e.g., "C major") or "--" if none
- **Compact layout:** Horizontal flex layout for toolbar integration

**Implementation:**
- Reads/writes `enabled`, `activeGenre`, `currentScaleName` from `useValidationStore`
- Uses `GENRE_PRESETS` for dropdown options with display names
- Color-coded status indicator (green dot for enabled, gray for disabled)
- Matches existing toolbar styling (bg-gray-800, text-gray-300)

### 4. PianoRollEditor Integration

Wired all components together and connected to validation store:

**Changes:**
- **Imports:** Added `useValidationStore`, `ValidationFeedback`, `TheoryControls`
- **State reads:** `scalePitchClasses`, `validationEnabled`, `updateScaleInfo`
- **Scale info updates:** `useEffect` calls `updateScaleInfo` on project/track/playhead changes
- **Toolbar addition:** `TheoryControls` after zoom controls, before mode indicator
- **Feedback placement:** `ValidationFeedback` between toolbar and main editor area
- **Canvas prop:** Pass `scalePitchClasses` to canvas (only if validation enabled)

## Verification

All verification criteria met:

- ✅ `npx tsc --noEmit` passes
- ✅ `npm run build` succeeds
- ✅ `npx vitest run` -- all 20 tests pass
- ✅ PianoRollCanvas accepts scalePitchClasses prop
- ✅ ValidationFeedback reads from validationStore
- ✅ TheoryControls toggles validation and selects genre
- ✅ PianoRollEditor wires all components together

## Success Criteria Met

All 6 success criteria achieved:

1. ✅ **Piano roll rows are visually tinted** based on scale membership (subtle blue for in-scale, faint red for out-of-scale)
2. ✅ **Validation errors appear as red banners** with the specific musical reason
3. ✅ **Validation warnings appear as amber banners** and auto-dismiss after 4 seconds
4. ✅ **User can toggle validation on/off** from the toolbar
5. ✅ **User can select a genre preset** from a dropdown (Classical, Jazz, Trap, Pop, None)
6. ✅ **Current key signature is displayed** in the toolbar (e.g., "Key: C major")

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 86a02d1 | feat | Add scale-aware row highlighting to piano roll canvas |
| 26aaa85 | feat | Create validation feedback and theory controls UI |

## Decisions Made

**1. Scale highlight colors**
- In-scale rows: `rgba(59, 130, 246, 0.06)` (faint blue)
- Out-of-scale rows: `rgba(239, 68, 68, 0.04)` (faint red)
- Rationale: Very low alpha prevents visual clutter, blue/red provides intuitive safe/unsafe cues

**2. Validation feedback placement**
- Between toolbar and canvas (not toast/modal)
- Rationale: Immediate visibility, inline with editing context, doesn't obstruct canvas

**3. Warning auto-dismiss timing**
- 4 seconds for warnings, manual dismiss only for errors
- Rationale: Errors block edits (user needs to understand why), warnings are informational only

**4. Theory controls location**
- Inline with toolbar after zoom controls
- Rationale: Logical grouping (zoom affects what you see, theory affects what's valid), accessible but not intrusive

**5. Scale info update triggers**
- Update on project load, track change, playhead position change
- Rationale: Ensures visual feedback always reflects current musical context at playhead position

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Ready for 04-05:** Yes - visual feedback is complete. Next plan can integrate with editStore to show validation results when user attempts invalid edits.

## Phase 4 Progress

Plans completed: 4 of 6

- ✅ 04-01: Core validation types and scale detection
- ✅ 04-02: ScaleValidator and TransitionValidator with test suite
- ✅ 04-03: GenreValidator and ValidationPipeline with store integration
- ✅ 04-04: Visual feedback and theory controls (this plan)
- ⬜ 04-05: Integration with editStore to block invalid edits
- ⬜ 04-06: Human verification of complete validation UX

**Status:** On track - validation UI complete, ready for edit integration.
