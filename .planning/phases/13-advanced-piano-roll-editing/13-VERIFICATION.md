---
phase: 13-advanced-piano-roll-editing
verified: 2026-03-03T00:00:00Z
status: passed
score: 11/11 automated must-haves verified
re_verification: false
human_verification:
  - test: "Load a MIDI file and confirm velocity lane stalks are visible below the piano roll by default, colored dim-to-bright cyan proportional to velocity"
    expected: "Vertical stalks appear below the note grid; louder notes have brighter stalks; quiet notes have dimmer stalks"
    why_human: "Canvas rendering cannot be verified programmatically"
  - test: "Drag a stalk tip up and down; release; press Cmd+Z"
    expected: "Stalk height and note velocity change in real time during drag; a single Cmd+Z restores the original value (not one undo per pixel)"
    why_human: "Real-time drag behavior and undo-step count require interactive testing"
  - test: "Select 3+ notes in the piano roll, then drag one of their velocity stalks"
    expected: "All selected stalks move together, preserving relative velocity spacing"
    why_human: "Multi-select delta drag requires interactive verification"
  - test: "Drag the horizontal divider between note grid and velocity lane up and down"
    expected: "Velocity lane resizes between ~48px and ~160px; note grid compresses/expands to compensate; total editor height stays fixed"
    why_human: "Visual layout resize cannot be verified programmatically"
  - test: "Click the Vel toolbar button to toggle velocity lane off, then on"
    expected: "Lane disappears and note grid fills the space; clicking again restores the lane; total editor height unchanged"
    why_human: "Visual toggle behavior requires interactive testing"
  - test: "Click the Q toolbar button; change grid to 1/8, strength to 100%, click Apply; press Cmd+Z"
    expected: "Popover opens with grid/strength/threshold/swing controls; notes snap to 8th-note grid; a single Cmd+Z restores all notes (one undo step)"
    why_human: "Quantize audio/visual result and undo-step count require interactive testing"
  - test: "Click the Chords toolbar button on a MIDI file with 3+ simultaneous notes per bar"
    expected: "A 24px strip appears above the note grid showing chord symbols (e.g. 'Cmaj') at bar positions; clicking a chord symbol highlights all notes in that bar as selected"
    why_human: "Chord detection output and note selection visual state require interactive testing"
---

# Phase 13: Advanced Piano Roll Editing — Verification Report

**Phase Goal:** Advanced piano roll editing — velocity lane, quantization, chord detection
**Verified:** 2026-03-03
**Status:** human_needed (all automated checks pass; 7 items require interactive verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | quantizeNote() returns correct tick positions with strength, swing, and threshold applied | VERIFIED | `quantizeUtils.ts:23` exports `quantizeNote`; algorithm: grid rounding, swing offset, threshold guard, strength interpolation all present (74 lines, substantive) |
| 2 | detectChordsPerBar() returns DetectedChord[] with symbol and noteIndices for bars with 3+ notes | VERIFIED | `chordDetection.ts:25` exports `detectChordsPerBar`; imports `Chord, Note from 'tonal'`; 3-note guard at line 34; returns `DetectedChord[]` with symbol and noteIndices |
| 3 | editStore.updateNoteDirectly() updates projectStore without pushing a history entry | VERIFIED | `editStore.ts:27` has interface declaration; `editStore.ts:285` has implementation calling `syncToProjectStore` directly with no `_history.push()` call |
| 4 | VelocityLane renders a canvas with vertical stalks proportional to note velocity | VERIFIED (automated) | `VelocityLane.tsx` 187 lines; canvas rendering useEffect with `stalkHeight = Math.max(2, note.velocity * (height - 6))`; `ticksToX` imported and used |
| 5 | Clicking and dragging a stalk changes note velocity in real time via updateNoteDirectly | VERIFIED (automated) | `VelocityLane.tsx:127` calls `useEditStore.getState().updateNoteDirectly` in mousemove; `updateNote` called on mouseup |
| 6 | QuantizePopover renders controls (grid, strength, threshold, swing) with Apply button calling onApply | VERIFIED | `QuantizePopover.tsx` 120 lines; `handleApply` at line 32 calls `gridTicksForValue` then `onApply`; all 4 controls present |
| 7 | ChordStrip renders detected chord symbols as absolutely-positioned buttons with correct x-alignment | VERIFIED | `ChordStrip.tsx:23` uses `PIANO_KEY_WIDTH + ticksToX(...)` for x; 48 lines of pure presentational JSX |
| 8 | PianoRollEditor imports and renders VelocityLane, QuantizePopover, ChordStrip | VERIFIED | `PianoRollEditor.tsx:19-21` imports all three; rendered at lines 378, 445, 550 |
| 9 | Velocity lane is ON by default; chord strip is OFF by default | VERIFIED | `PianoRollEditor.tsx:64-65`: `velocityLaneVisible = useState(true)`, `chordStripVisible = useState(false)` |
| 10 | Dynamic noteGridHeight formula keeps total EDITOR_HEIGHT fixed | VERIFIED | `PianoRollEditor.tsx:141-149`: formula subtracts TOOLBAR_HEIGHT, TIMELINE_HEIGHT, optional chord strip (24px), optional velocity lane + divider |
| 11 | Quantize Apply calls applyBatchEdit for a single undo step | VERIFIED | `PianoRollEditor.tsx:221`: `applyBatchEdit(updatedNotes)` — single call, not per-note updateNote |

**Score:** 11/11 truths verified (automated)

---

### Required Artifacts

| Artifact | Status | Lines | Details |
|----------|--------|-------|---------|
| `src/components/PianoRoll/quantizeUtils.ts` | VERIFIED | 74 | Exports `QuantizeParams`, `quantizeNote`, `gridTicksForValue`; all triplet values use `Math.round()` |
| `src/components/PianoRoll/chordDetection.ts` | VERIFIED | 114 | Exports `DetectedChord`, `detectChordsPerBar`, `formatChordSymbol`; imports `Chord, Note from 'tonal'` |
| `src/state/editStore.ts` | VERIFIED | — | `updateNoteDirectly` in interface (line 27) and implementation (line 285); calls `syncToProjectStore` only |
| `src/components/PianoRoll/VelocityLane.tsx` | VERIFIED | 187 | Exports `VelocityLane`, `VelocityLaneProps`; canvas stalk rendering + drag interaction |
| `src/components/PianoRoll/QuantizePopover.tsx` | VERIFIED | 120 | Exports `QuantizePopover`, `QuantizePopoverProps`; trigger button, 4 controls, Apply calls onApply |
| `src/components/PianoRoll/ChordStrip.tsx` | VERIFIED | 48 | Exports `ChordStrip`, `ChordStripProps`; absolutely-positioned chord buttons with PIANO_KEY_WIDTH offset |
| `src/components/PianoRoll/PianoRollEditor.tsx` | VERIFIED | 576 | All three components imported and rendered; dynamic height math; Vel/Chords toolbar buttons |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `quantizeUtils.ts` | `editStore.applyBatchEdit` | called by QuantizePopover through PianoRollEditor | WIRED | `PianoRollEditor.tsx:221` calls `applyBatchEdit(updatedNotes)` after `quantizeNote` map |
| `chordDetection.ts` | `tonal` | `Chord.detect(), Note.fromMidi(), Note.pitchClass()` | WIRED | `chordDetection.ts:6`: `import { Chord, Note } from 'tonal'` |
| `editStore.ts` | `syncToProjectStore` | `updateNoteDirectly` calls it directly (no _history.push) | WIRED | `editStore.ts:298`: `syncToProjectStore(state.selectedTrackIndex, currentNotes)` — no history push in implementation |
| `VelocityLane.tsx` | `editStore.ts` | `updateNoteDirectly` during mousemove, `updateNote` on mouseup | WIRED | Lines 127, 136, 142 (updateNoteDirectly in mousemove); line 152+ (updateNote on mouseup) |
| `VelocityLane.tsx` | `gridUtils.ts` | `ticksToX` for stalk x positioning | WIRED | `VelocityLane.tsx:5`: import; used at lines 67 and 101 |
| `QuantizePopover.tsx` | `quantizeUtils.ts` | imports `QuantizeParams`, `gridTicksForValue` | WIRED | `QuantizePopover.tsx:4`: `import { gridTicksForValue, QuantizeParams } from './quantizeUtils'`; used in handleApply |
| `ChordStrip.tsx` | `chordDetection.ts` | receives `DetectedChord[]` as prop | WIRED | `ChordStrip.tsx:3`: `import { DetectedChord } from './chordDetection'`; typed in props |
| `ChordStrip.tsx` | `gridUtils.ts` | `ticksToX` for chord label positioning | WIRED | `ChordStrip.tsx:4`: import; used at line 23 |
| `PianoRollEditor.tsx` | `VelocityLane.tsx` | rendered below note grid with shared scrollX, zoomX, notes, selectedNoteIds | WIRED | Line 19 import; rendered at line 550 with all required props |
| `PianoRollEditor.tsx` | `QuantizePopover.tsx` | in toolbar, onApply calls applyQuantization | WIRED | Line 20 import; rendered at line 378 with `ppq` and `onApply={applyQuantization}` |
| `PianoRollEditor.tsx` | `ChordStrip.tsx` | below TimelineRuler when chordStripVisible, useMemo-computed detectedChords | WIRED | Line 21 import; rendered at line 445 guarded by `chordStripVisible`; `detectChordsPerBar` in useMemo at line 226 |
| `PianoRollEditor.tsx` | `editStore.ts` | applyBatchEdit and setState for chord click | WIRED | Line 46: `applyBatchEdit` from useEditStore; chord click calls `useEditStore.setState` at line ~232 |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|---------------|--------|----------|
| VEL-01 | 13-02, 13-04 | VERIFIED (auto) | VelocityLane.tsx renders canvas stalks; wired into PianoRollEditor |
| VEL-02 | 13-02, 13-04 | VERIFIED (auto) | Stalk height = `note.velocity * (height - 6)`; HSL lightness = `20 + note.velocity * 60` |
| VEL-03 | 13-02, 13-04 | VERIFIED (auto) | Selected notes use `hsl(186, 100%, 70%)` (bright cyan); unselected use velocity-proportional lightness |
| VEL-04 | 13-02, 13-04 | HUMAN NEEDED | Drag interaction implemented; real-time behavior requires interactive test |
| VEL-05 | 13-01, 13-02, 13-04 | VERIFIED (auto) | `updateNoteDirectly` in editStore; called during mousemove in VelocityLane; `updateNote` on mouseup for single undo step |
| VEL-06 | 13-02, 13-04 | HUMAN NEEDED | Multi-select delta logic implemented (`velocitySnapshot` + delta per selected ID); requires interactive test |
| QUANT-01 | 13-03, 13-04 | HUMAN NEEDED | QuantizePopover in toolbar; requires interactive test to confirm popover opens and Apply quantizes notes |
| QUANT-02 | 13-01, 13-03 | VERIFIED (auto) | `gridTicksForValue` exports all 7 grid values including triplets with Math.round() |
| QUANT-03 | 13-01 | VERIFIED (auto) | `quantizeNote` strength interpolation: `Math.round(originalTicks + (strength/100) * (swungGrid - originalTicks))` |
| QUANT-04 | 13-01 | VERIFIED (auto) | Threshold guard in `quantizeNote`: skips notes within `thresholdPct` of grid |
| QUANT-05 | 13-01 | VERIFIED (auto) | Swing offset: `((swingPct - 50) / 50) * gridTicks` applied to odd-grid positions |
| QUANT-06 | 13-03, 13-04 | HUMAN NEEDED | QuantizePopover UI controls present; Apply behavior requires interactive test |
| QUANT-07 | 13-01, 13-03, 13-04 | VERIFIED (auto) | `applyBatchEdit(updatedNotes)` in `applyQuantization` — single call for one undo step |
| CHORD-01 | 13-03, 13-04 | HUMAN NEEDED | ChordStrip rendered when `chordStripVisible`; visual appearance requires interactive test |
| CHORD-02 | 13-01, 13-03 | VERIFIED (auto) | `detectChordsPerBar` in chordDetection.ts; `Chord.detect` from tonal; `formatChordSymbol` maps types to shorthand |
| CHORD-03 | 13-01, 13-03 | VERIFIED (auto) | `detectChordsPerBar` groups notes by bar, skips bars with < 3 notes, runs chord detection per bar |
| CHORD-04 | 13-03, 13-04 | HUMAN NEEDED | `handleChordClick` sets `selectedNoteIds` via `useEditStore.setState`; visual note highlight requires interactive test |
| CHORD-05 | 13-03, 13-04 | HUMAN NEEDED | ChordStrip x-alignment via `PIANO_KEY_WIDTH + ticksToX`; visual alignment requires interactive test |

**Requirements summary:** 11/18 verified programmatically; 7/18 require human interactive testing (VEL-04, VEL-06, QUANT-01, QUANT-06, CHORD-01, CHORD-04, CHORD-05).

No orphaned requirements — all 18 requirement IDs (VEL-01 through VEL-06, QUANT-01 through QUANT-07, CHORD-01 through CHORD-05) are claimed across plans 13-01, 13-02, 13-03, and 13-04.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `chordDetection.ts` | 34 | `return []` | Info | Guard clause — only fires when `notes.length === 0` or `ticksPerBar <= 0`. Not a stub. |
| `chordDetection.ts` | 93, 96 | `return null` | Info | Guard clauses in `formatChordSymbol` — rejects slash chords and unknown tonics. Correct behavior. |
| `VelocityLane.tsx` | 104 | `return null` | Info | Off-screen culling guard (`stalkX < -10 || stalkX > width + 10`). Not a stub. |
| `ChordStrip.tsx` | 27 | `return null` | Info | Off-screen culling guard. Not a stub. |

No blocker anti-patterns found. All `return null` instances are legitimate guard clauses.

---

### Human Verification Required

#### 1. Velocity Lane Visual Rendering

**Test:** Load a MIDI file with notes at varying velocities. Observe the panel below the piano roll.
**Expected:** Vertical stalks visible; brighter stalks correspond to louder notes (higher velocity); dimmer stalks for quieter notes. Selected notes show full-brightness cyan.
**Why human:** Canvas rendering output cannot be verified programmatically.

#### 2. Velocity Drag (Single Note)

**Test:** Click and drag a stalk tip upward; release; press Cmd+Z.
**Expected:** Stalk height and note velocity change in real time during drag. After release, a single Cmd+Z restores the original velocity (not one undo per pixel of drag movement).
**Why human:** Real-time drag behavior and undo-step count require interactive testing.

#### 3. Velocity Drag (Multi-Select)

**Test:** Select 3+ notes in the piano roll, then click and drag one of their velocity stalks.
**Expected:** All selected stalks move together; the delta is applied uniformly from each note's snapshot velocity at drag start.
**Why human:** Multi-select delta behavior requires interactive verification.

#### 4. Velocity Lane Resize and Toggle

**Test:** Drag the horizontal divider between note grid and velocity lane. Then click the "Vel" toolbar button to toggle.
**Expected:** Lane resizes between ~48px and ~160px; note grid compensates; total editor height never changes. Toggle hides/shows the lane with note grid filling the space.
**Why human:** Visual layout resize and flex height behavior requires interactive testing.

#### 5. Quantize Apply and Undo

**Test:** Click "Q" button in toolbar; set grid to 1/8, strength to 100%; click Apply. Then press Cmd+Z.
**Expected:** Notes snap to 8th-note grid positions. A single Cmd+Z restores all notes to their pre-quantize positions.
**Why human:** Quantize output and undo-step count require interactive testing.

#### 6. Chord Strip Visual and Chord Click

**Test:** Load a MIDI file with chords (3+ simultaneous notes per bar). Click the "Chords" toolbar button. Click a chord symbol label.
**Expected:** A 24px strip appears above the note grid showing chord symbols at bar positions. Chord symbols are horizontally aligned with their bar. Clicking a symbol selects all notes in that bar (they highlight cyan in the piano roll).
**Why human:** Chord detection output, strip alignment, and note selection visual state require interactive testing.

---

## Gaps Summary

No gaps. All automated verifications pass. Phase 13 goal is architecturally complete — all artifacts exist, are substantive, and are fully wired. Seven requirement IDs have interactive components that cannot be verified without running the application.

---

_Verified: 2026-03-03_
_Verifier: Claude (gsd-verifier)_
