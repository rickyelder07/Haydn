# Phase 7: Multi-Track Support - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the single-track editor to support multiple tracks (up to 32) with independent control including mute/solo/add/remove operations. System must handle up to 5,000 notes across all tracks without performance issues. Each track displays its instrument name clearly in the interface.

</domain>

<decisions>
## Implementation Decisions

### Mute/solo interaction patterns
- Controls inline with each track in the list (not separate panel)
- Non-exclusive solo mode - multiple tracks can be soloed simultaneously
- Icon-only visual states with opacity changes (not color-coded)
- Global reset button to clear all mute/solo states at once
- Changes apply immediately during playback without interruption
- No keyboard shortcuts - mouse/touch interaction only
- Solo state persists independently from track selection (Claude's discretion on exact behavior)
- All tracks reset to unmuted/unsoloed when loading a new project

### Track list layout and visual hierarchy
- Scrollable list with all tracks visible (not collapsible groups)
- Selected/active track indicated by left accent bar + light border
- Each track displays: instrument name, relevant instrument icon, and track controls (mute/solo)
- Fixed left sidebar position - always visible, piano roll on the right

### Track management operations
- Add new track via modal dialog with instrument selection
- New tracks are empty with selected instrument and default MIDI channel
- Track deletion requires confirmation dialog before delete
- Drag and drop to reorder tracks in the list

### Piano roll multi-track display
- Show all tracks in piano roll with selected track emphasized
- Color per track + opacity combination for visual distinction
- Non-selected tracks rendered as dimmed ghost notes
- Users must select a track before editing its notes (clicking ghost note doesn't auto-switch)
- Toolbar toggle to show/hide all ghost notes (selected track always visible)

### Claude's Discretion
- Exact track color palette for multi-track display
- Precise opacity values for ghost notes (dimming level)
- Instrument icon mapping for track list
- Modal dialog design and instrument categorization
- Drag and drop implementation details
- Exact behavior when clicking ghost notes in piano roll (select track or no-op)

</decisions>

<specifics>
## Specific Ideas

No specific references mentioned - open to standard DAW-style approaches for multi-track management.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 07-multi-track-support*
*Context gathered: 2026-02-08*
