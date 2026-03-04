---
phase: 14-midi-hardware-integration
plan: 03
subsystem: ui
tags: [midi, react, zustand, typescript, components, transport]

# Dependency graph
requires:
  - phase: 14-01
    provides: midiInputStore with isConnected/isArmed/isRecording/devices/error/connect/disconnect/setArmed
provides:
  - MidiConnectButton component (src/components/Midi/MidiConnectButton.tsx)
  - MidiDeviceList component (src/components/Midi/MidiDeviceList.tsx)
  - TransportStrip arm button and recording indicator
affects:
  - page.tsx or header (consumer of MidiConnectButton — added in later plan)
  - 14-02 (recording pipeline UI feedback via isRecording indicator already in place)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMidiInputStore selector subscriptions for granular re-renders
    - Click-outside popover dismiss via useEffect + document mousedown listener
    - Conditional UI gated on isConnected — arm button hidden when no MIDI device

key-files:
  created:
    - src/components/Midi/MidiConnectButton.tsx
    - src/components/Midi/MidiDeviceList.tsx
  modified:
    - src/components/TimelineRuler/TransportStrip.tsx

key-decisions:
  - "Arm button gated behind isConnected — no arm button until MIDI device connected"
  - "Click-outside popover uses useEffect + document mousedown with popoverRef — avoids onBlur focus issues on child elements"
  - "Record arm and recording indicator inserted before loading label — preserves stop→arm→indicator→loading→loop→tempo order"
  - "MidiConnectButton: clicking connected button toggles device list (not disconnect) — user must use popover Disconnect button for explicit disconnection"

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 14 Plan 03: MIDI Hardware UI Components Summary

**MidiConnectButton with device popover, MidiDeviceList, and TransportStrip arm button + recording indicator — all wired to midiInputStore**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-04T18:23:34Z
- **Completed:** 2026-03-04T18:25:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- MidiConnectButton provides connect/disconnect toggle with cyan connected state, grey disconnected state, spinner during connect(), and red error display below button
- Device list popover appears on connected state click, lists all MIDI input names via MidiDeviceList with green indicator dots, closes on outside click
- MidiDeviceList renders device names or "No devices found" fallback
- TransportStrip: record arm button (red themed, circle icon) appears only when MIDI connected; pulsing red dot recording indicator appears when isRecording is true
- All additions are purely additive — no existing TransportStrip elements modified or removed
- TypeScript compiles with zero errors; Next.js production build passes

## Task Commits

Each task was committed atomically:

1. **Task 1: MidiConnectButton and MidiDeviceList components** - `45c0d40` (feat)
2. **Task 2: Add arm button and recording indicator to TransportStrip** - `df4a753` (feat)

## Files Created/Modified

- `src/components/Midi/MidiConnectButton.tsx` - Connect/disconnect button with device count, error display, device list popover, click-outside dismiss
- `src/components/Midi/MidiDeviceList.tsx` - Device names list with green dot indicators, empty state fallback
- `src/components/TimelineRuler/TransportStrip.tsx` - Added useMidiInputStore subscriptions, record arm button (isConnected gated), pulsing recording indicator (isRecording gated)

## Decisions Made

- **Arm button gated on isConnected** — The arm button only makes sense when a MIDI device is plugged in; showing it without connection would confuse users
- **Click-outside uses useEffect + document mousedown** — onBlur fires on the button itself and misses child element interactions; a document-level listener with a ref is more reliable for popovers
- **Popover button is toggle, not disconnect** — Clicking "MIDI (2)" when connected opens/closes the device list; actual disconnect happens via the explicit Disconnect button inside the popover, making disconnect deliberate
- **Recording indicator placed before loading label** — Keeps transport controls in logical order: play/stop → arm → recording status → loading status → loop → tempo

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `src/components/Midi/MidiConnectButton.tsx` — FOUND
- `src/components/Midi/MidiDeviceList.tsx` — FOUND
- `src/components/TimelineRuler/TransportStrip.tsx` isArmed/isRecording/setArmed — FOUND (lines 56-58, 99, 102, 115)
- Commit `45c0d40` — FOUND
- Commit `df4a753` — FOUND
- `npx tsc --noEmit` — PASS
- `npm run build` — PASS

## Next Phase Readiness

- Plan 14-04 (live playback) can now integrate MidiConnectButton into the header/transport area
- MidiConnectButton is ready to be placed in page.tsx header (after existing NewProjectButton + ExportButton)
- TransportStrip arm button is functional — will activate once Plan 14-02 recording pipeline wires startRecording/stopRecording to playback events

---
*Phase: 14-midi-hardware-integration*
*Completed: 2026-03-04*
