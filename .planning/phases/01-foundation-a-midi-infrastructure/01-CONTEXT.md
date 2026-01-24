# Phase 1: Foundation & MIDI Infrastructure - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

File I/O, MIDI parsing, and data model for importing MIDI/MusicXML files, viewing parsed data, and exporting to standard MIDI format. This establishes the foundation for all downstream phases.

</domain>

<decisions>
## Implementation Decisions

### Parsed Data Display
- **Initial view:** Track summary only (track names and instrument types)
- **Track list layout:** Claude's discretion (simple list vs card-based)
- **Metadata visibility:** Collapsible section showing tempo, time signature, key signature
- **Track naming:** Auto-generate names for unnamed tracks (e.g., "Piano Track", "Drum Track" based on instrument detection)
- **Track details:** Show both note count and duration per track (e.g., "127 notes, 2:34")
- **Current file indicator:** Display original filename in UI (header or top bar)
- **Re-import capability:** Allow re-import with confirmation if project exists

### Data Model Structure
- **Time representation:** Ticks (MIDI native) for precision and file format compatibility
- **Data normalization:** Professional preference - Claude decides between normalize vs preserve (consider what music producers expect)
- **Metadata preservation:** Preserve as much as reasonable:
  - Tempo & time signature (essential)
  - Key signature (critical for theory validation)
  - Track names & colors (organization)
  - Control changes/CC data (expression, sustain, modulation)
  - Any other reasonable metadata
- **MusicXML handling:** Claude's discretion (convert immediately vs preserve source format)

### Claude's Discretion
- Track list visual layout (list vs cards)
- Error UI patterns for failed imports
- MusicXML conversion strategy
- Data normalization approach (what professional producers expect)

</decisions>

<specifics>
## Specific Ideas

- For auto-generated track names, use intelligent detection: "Piano Track" not "Track 1" when instrument is identifiable
- Re-import should warn about unsaved changes even though v1 has no persistence (good UX pattern)
- Metadata section collapsible keeps initial view clean while making info accessible

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-a-midi-infrastructure*
*Context gathered: 2026-01-23*
