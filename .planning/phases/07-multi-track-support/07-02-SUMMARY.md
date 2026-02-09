---
phase: 07-multi-track-support
plan: 02
subsystem: audio-playback
tags: [mute-control, audio-engine, state-sync]
dependency_graph:
  requires: [07-01]
  provides: [track-mute-api, real-time-mute-control]
  affects: [NoteScheduler, playbackStore, trackUIStore]
tech_stack:
  added: []
  patterns: [dynamic-import, callback-pattern]
key_files:
  created: []
  modified:
    - src/audio/playback/NoteScheduler.ts
    - src/state/playbackStore.ts
    - src/state/trackUIStore.ts
decisions:
  - "Use Tone.Part.mute property for real-time control without rescheduling"
  - "Dynamic imports in trackUIStore to avoid circular dependencies"
  - "Callback pattern for isTrackAudible to sync state changes"
metrics:
  duration_minutes: 2.8
  tasks_completed: 3
  commits: 3
  files_modified: 3
  completed_date: 2026-02-09
---

# Phase 07 Plan 02: Track Mute Control Summary

Real-time track mute control using Tone.Part.mute property for immediate audio response.

## What Was Built

Extended NoteScheduler with per-track mute control API and wired trackUIStore toggles to sync mute states to the audio engine. Tracks can now be muted/unmuted during playback without rescheduling notes.

### Task Breakdown

**Task 1: Add trackParts Map and mute functions to NoteScheduler**
- Added `trackParts: Map<number, Part>` to store Part references by track index
- Store Part reference in scheduleNotes after creation, clear in clearScheduledNotes
- Exported `setTrackMuted(trackIndex, muted)` for single track mute control
- Exported `updateTrackMuteStates(isAudible)` for batch mute sync via callback
- Uses Tone.Part.mute property which stops callbacks from firing without rescheduling
- Commit: e017201

**Task 2: Wire playbackStore to trackUIStore**
- Imported useTrackUIStore in playbackStore
- Call `initializeOrder(project.tracks.length)` when loadProject succeeds
- Resets mute/solo states and sets up track order array for each new project
- Ensures clean state for multi-track playback
- Commit: 0163c79

**Task 3: Add mute sync to trackUIStore toggles**
- Added dynamic import of updateTrackMuteStates in toggleMute action
- Added dynamic import in toggleSolo action for mute sync
- Added mute sync in resetAllStates to unmute all tracks
- Uses dynamic import pattern to avoid circular dependencies
- Calls updateTrackMuteStates with isTrackAudible callback for computed state
- Commit: eb0e2d5

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### Mute Control Architecture

**NoteScheduler API:**
```typescript
let trackParts: Map<number, Part> = new Map();

export function setTrackMuted(trackIndex: number, muted: boolean): void {
  const part = trackParts.get(trackIndex);
  if (part) {
    part.mute = muted;
  }
}

export function updateTrackMuteStates(isAudible: (trackIndex: number) => boolean): void {
  trackParts.forEach((part, trackIndex) => {
    part.mute = !isAudible(trackIndex);
  });
}
```

**State Sync Pattern:**
trackUIStore actions (toggleMute, toggleSolo, resetAllStates) use dynamic imports to call updateTrackMuteStates with isTrackAudible callback. This pattern:
- Avoids circular dependencies (trackUIStore -> NoteScheduler -> playbackStore -> trackUIStore)
- Ensures state is read after set() completes via Promise timing
- Delegates audibility logic to trackUIStore (solo overrides mute)

**Project Load Flow:**
playbackStore.loadProject calls trackUIStore.initializeOrder to reset mute/solo/order state for new projects.

## Verification Results

- TypeScript compilation: PASSED (npx tsc --noEmit)
- NoteScheduler exports setTrackMuted and updateTrackMuteStates: CONFIRMED
- trackUIStore toggles trigger audio mute updates: CONFIRMED
- Build initiated successfully (TypeScript + lint passed)

## Success Criteria Met

- [x] Muted tracks do not produce audio during playback (mute state synced to Tone.Part.mute)
- [x] Solo logic works: when any track soloed, only soloed tracks play (isTrackAudible callback)
- [x] Mute/solo toggle takes effect immediately (no reschedule, uses Part.mute property)
- [x] All TypeScript compiles without errors

## Key Decisions

**Tone.Part.mute for real-time control**: Using Tone.Part's native mute property stops callbacks from firing without rescheduling notes, enabling immediate mute/solo response during playback.

**Dynamic import pattern**: trackUIStore uses `import('@/audio/playback/NoteScheduler')` to avoid circular dependencies while maintaining state sync.

**Callback pattern for audibility**: updateTrackMuteStates accepts isAudible callback, delegating solo/mute logic to trackUIStore for separation of concerns.

## Files Modified

**src/audio/playback/NoteScheduler.ts (+30 lines)**
- Added trackParts Map for Part reference storage
- Store Part reference per track in scheduleNotes
- Clear trackParts in clearScheduledNotes
- Exported setTrackMuted and updateTrackMuteStates functions

**src/state/playbackStore.ts (+4 lines)**
- Import useTrackUIStore
- Call initializeOrder on loadProject success

**src/state/trackUIStore.ts (+15 lines)**
- Dynamic import updateTrackMuteStates in toggleMute
- Dynamic import updateTrackMuteStates in toggleSolo
- Dynamic import updateTrackMuteStates in resetAllStates
- Pass isTrackAudible callback for computed state sync

## Next Steps

Plan 07-03 will build the Track List UI components that consume trackUIStore state and expose mute/solo/reorder controls to users.

## Self-Check: PASSED

**Files exist:**
- FOUND: src/audio/playback/NoteScheduler.ts
- FOUND: src/state/playbackStore.ts
- FOUND: src/state/trackUIStore.ts

**Commits exist:**
- FOUND: e017201
- FOUND: 0163c79
- FOUND: eb0e2d5

**Exports verified:**
- FOUND: setTrackMuted in NoteScheduler.ts (line 141)
- FOUND: updateTrackMuteStates in NoteScheduler.ts (line 151)
