# Phase 1: Foundation & MIDI Infrastructure - Research

**Researched:** 2026-01-23
**Domain:** MIDI/MusicXML file parsing and manipulation in web applications
**Confidence:** HIGH

## Summary

Phase 1 focuses on enabling MIDI and MusicXML file import/export in a web application using client-side JavaScript libraries. The standard approach uses @tonejs/midi (version 2.0.28) for MIDI parsing and manipulation, paired with musicxml-interfaces for MusicXML parsing. Both libraries work with ArrayBuffer data from browser FileReader APIs, enabling fully client-side file processing without server dependencies.

The MIDI ecosystem has well-established patterns: @tonejs/midi converts MIDI binary into JSON structures with tracks, notes, and timing data using both ticks (MIDI native) and seconds. For export compatibility with DAWs (Logic Pro X, Ableton, FL Studio), standard MIDI Format 1 (multi-track) is preferred, though Format 0 (single track) offers broader device compatibility. MusicXML conversion to MIDI requires an intermediate step using libraries like musicxml-midi or Verovio.

**Primary recommendation:** Use @tonejs/midi for all MIDI operations (import, manipulation, export) with ticks as the primary time representation. Use musicxml-interfaces for MusicXML parsing, then convert to the internal MIDI-based data model. Preserve all metadata (tempo, time signatures, key signatures, CC data, program changes) to ensure professional DAW compatibility.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tonejs/midi | 2.0.28 | MIDI parsing and export | Industry standard for web MIDI manipulation, converts binary MIDI to JSON and back, actively used in production applications |
| musicxml-interfaces | 0.0.21 | MusicXML parsing | Low-level parser with one-to-one mapping of MusicXML to JSON, TypeScript-friendly, no rendering dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| musicxml-midi | Latest | MusicXML to MIDI conversion | When direct MusicXML to MIDI conversion is needed (not just parsing) |
| Verovio | 1.9.3+ | MusicXML rendering and conversion | If MusicXML rendering or high-fidelity conversion is required (future phases) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tonejs/midi | midi-file directly | midi-file is the underlying parser but @tonejs/midi adds essential JSON conversion, time normalization (ticks + seconds), and cleaner API |
| musicxml-interfaces | @stringsync/musicxml | @stringsync/musicxml enforces validation but API marked unstable; musicxml-interfaces is simpler and stable |
| Client-side parsing | Server-side conversion | Increases infrastructure complexity, adds latency, contradicts project's single-session web app architecture |

**Installation:**
```bash
npm install @tonejs/midi musicxml-interfaces
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── midi/
│   │   ├── parser.ts        # @tonejs/midi wrapper for import
│   │   ├── exporter.ts      # MIDI export logic
│   │   ├── validator.ts     # File validation before parsing
│   │   └── types.ts         # TypeScript types for internal data model
│   ├── musicxml/
│   │   ├── parser.ts        # musicxml-interfaces wrapper
│   │   └── converter.ts     # MusicXML to internal format conversion
│   └── instruments/
│       └── gm-mapping.ts    # General MIDI instrument name mapping (program 0-127)
├── components/
│   ├── FileUpload/          # Drag-drop and file input component
│   ├── TrackList/           # Display parsed track data
│   └── MetadataDisplay/     # Tempo, time sig, key sig display
└── state/
    └── projectStore.ts      # State management for parsed MIDI data
```

### Pattern 1: File Upload with ArrayBuffer Parsing
**What:** Use FileReader API to convert uploaded files to ArrayBuffer, then parse with @tonejs/midi
**When to use:** All MIDI/MusicXML file imports in browser environment
**Example:**
```typescript
// Source: https://github.com/Tonejs/Midi + MDN FileReader patterns
async function parseMidiFile(file: File): Promise<Midi> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const midi = new Midi(arrayBuffer);
        resolve(midi);
      } catch (error) {
        reject(new Error('Failed to parse MIDI file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
```

### Pattern 2: Track Instrument Detection
**What:** Use MIDI program numbers and channel detection to identify instruments
**When to use:** Auto-generating track names, displaying instrument types
**Example:**
```typescript
// Source: https://github.com/Tonejs/Midi + General MIDI spec
function getTrackInstrumentName(track: Track): string {
  // Channel 9/10 (index 9) is percussion in General MIDI
  if (track.channel === 9) {
    return 'Drums';
  }

  // Get instrument name from track.instrument.name (derived from program changes)
  return track.instrument?.name || 'Unknown Instrument';
}

function generateTrackName(track: Track, index: number): string {
  const instrumentName = getTrackInstrumentName(track);
  return track.name || `${instrumentName} Track ${index + 1}`;
}
```

### Pattern 3: Ticks-Based Time Representation
**What:** Store and manipulate note timing in MIDI ticks, convert to seconds for display only
**When to use:** Internal data model, all time-based calculations
**Example:**
```typescript
// Source: @tonejs/midi API + MIDI timing specifications
// @tonejs/midi provides both representations:
interface NoteData {
  midi: number;          // MIDI note number (0-127)
  time: number;          // Time in seconds (calculated from ticks)
  ticks: number;         // Time in MIDI ticks (native representation)
  duration: number;      // Duration in seconds
  durationTicks: number; // Duration in ticks
  velocity: number;      // 0-1 normalized
}

// Use ticks for precision, seconds for display
function formatNoteTime(note: NoteData): string {
  return `${note.time.toFixed(2)}s`; // Display in seconds
}

// Store ticks in data model for lossless export
const internalNote = {
  ticks: note.ticks,
  durationTicks: note.durationTicks,
  // ... other properties
};
```

### Pattern 4: MIDI Export with Metadata Preservation
**What:** Use @tonejs/midi's builder API to reconstruct MIDI from internal data model
**When to use:** Export functionality, ensuring DAW compatibility
**Example:**
```typescript
// Source: @tonejs/midi API documentation
function exportToMidi(projectData: ProjectData): Uint8Array {
  const midi = new Midi();

  // Preserve header metadata
  midi.header.name = projectData.name;
  midi.header.ppq = projectData.ppq || 480; // Pulses per quarter note

  // Add tempo events
  projectData.tempos.forEach(tempo => {
    midi.header.setTempo(tempo.bpm, tempo.ticks);
  });

  // Add time signatures
  projectData.timeSignatures.forEach(ts => {
    midi.header.timeSignatures.push({
      ticks: ts.ticks,
      timeSignature: [ts.numerator, ts.denominator]
    });
  });

  // Rebuild tracks
  projectData.tracks.forEach(trackData => {
    const track = midi.addTrack();
    track.name = trackData.name;
    track.channel = trackData.channel;

    // Add notes using ticks for precision
    trackData.notes.forEach(note => {
      track.addNote({
        midi: note.midi,
        ticks: note.ticks,
        durationTicks: note.durationTicks,
        velocity: note.velocity
      });
    });

    // Preserve control changes (CC data)
    trackData.controlChanges?.forEach(cc => {
      track.addCC({
        number: cc.number,
        value: cc.value,
        ticks: cc.ticks
      });
    });
  });

  // Return as byte array for file download
  return midi.toArray();
}
```

### Pattern 5: State Management for MIDI Data
**What:** Use lightweight atomic state (Zustand/Jotai) for project data
**When to use:** Managing parsed MIDI, track visibility, playback state
**Example:**
```typescript
// Source: React state management patterns 2026
import { create } from 'zustand';

interface ProjectStore {
  midi: Midi | null;
  originalFileName: string | null;
  tracks: TrackData[];
  metadata: {
    tempo: number;
    timeSignature: [number, number];
    keySignature?: string;
  };

  // Actions
  loadMidiFile: (file: File) => Promise<void>;
  exportMidi: () => Uint8Array;
  updateTrackName: (trackIndex: number, name: string) => void;
}

const useProjectStore = create<ProjectStore>((set, get) => ({
  midi: null,
  originalFileName: null,
  tracks: [],
  metadata: { tempo: 120, timeSignature: [4, 4] },

  loadMidiFile: async (file: File) => {
    const midi = await parseMidiFile(file);
    set({
      midi,
      originalFileName: file.name,
      tracks: midi.tracks.map((t, i) => ({
        name: generateTrackName(t, i),
        noteCount: t.notes.length,
        duration: t.duration,
        instrument: t.instrument?.name
      })),
      metadata: {
        tempo: midi.header.tempos[0]?.bpm || 120,
        timeSignature: midi.header.timeSignatures[0]?.timeSignature || [4, 4],
        keySignature: midi.header.keySignatures[0]?.key
      }
    });
  },

  exportMidi: () => {
    const { midi } = get();
    if (!midi) throw new Error('No MIDI data to export');
    return midi.toArray();
  },

  updateTrackName: (trackIndex: number, name: string) => {
    set(state => ({
      tracks: state.tracks.map((t, i) =>
        i === trackIndex ? { ...t, name } : t
      )
    }));
  }
}));
```

### Anti-Patterns to Avoid
- **Converting everything to seconds immediately:** Ticks preserve MIDI precision; converting to seconds on import loses fidelity for export
- **Ignoring PPQ (Pulses Per Quarter Note):** PPQ determines tick-to-time conversion; must be preserved from source file
- **Dropping metadata on import:** Tempo changes, time signature changes, key signatures, and CC data are essential for professional DAW compatibility
- **Assuming all tracks have names:** Many MIDI files have unnamed tracks; auto-generate names based on instrument detection
- **Not validating file headers:** MIDI files should start with "MThd" header; validate before parsing to provide better error messages
- **Using BPM without checking tempo events:** MIDI files can have multiple tempo changes; always check `midi.header.tempos` array

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIDI binary parsing | Custom parser reading bytes | @tonejs/midi | MIDI spec is complex: variable-length values, big-endian encoding, running status, meta events. @tonejs/midi handles all edge cases. |
| Tick to seconds conversion | Manual tempo calculations | @tonejs/midi's built-in conversion | Tempo can change mid-song, PPQ varies by file. Library tracks all tempo events automatically. |
| General MIDI instrument mapping | Manual program number lookup | @tonejs/midi's `instrument.name` | Library includes complete GM mapping (128 instruments), handles percussion channel (9/10) specially. |
| MusicXML parsing | Custom XML parser | musicxml-interfaces | MusicXML spec is 500+ pages with nested structures, repeats, articulations, dynamics. Parser handles all element types. |
| MIDI file validation | Checking file extension | Proper header validation + try/catch | Extensions can be wrong; validate ArrayBuffer starts with "MThd" (4D 54 68 64 hex), handle parse errors gracefully. |
| File download in browser | Complex Blob manipulation | Proven pattern: `URL.createObjectURL(new Blob([uint8Array]))` | Browser compatibility issues, memory management, MIME types already solved. |

**Key insight:** MIDI and MusicXML are deceptively complex binary/XML formats with decades of edge cases. Industry-standard libraries handle Format 0 vs Format 1, running status, sysex messages, tempo maps, and DAW-specific quirks that would take months to discover and fix manually.

## Common Pitfalls

### Pitfall 1: BPM Assumption on Load
**What goes wrong:** @tonejs/midi defaults to 120 BPM if no tempo events found, causing incorrect time calculations for notes
**Why it happens:** MIDI files may omit tempo meta events, assuming default 120 BPM, but @tonejs/midi's time calculations depend on accurate tempo
**How to avoid:** Always check `midi.header.tempos` array; if empty, file uses default 120 BPM. For export, explicitly add tempo event even if 120 BPM
**Warning signs:** Note times don't match expected musical timing, tracks seem too fast/slow when compared to original

### Pitfall 2: TypeScript Declaration Errors
**What goes wrong:** Import errors for '@tonejs/midi' with "Could not find a declaration file for module 'midi-file'" in TypeScript projects
**Why it happens:** @tonejs/midi depends on midi-file which may have incomplete type declarations
**How to avoid:** Add type declaration file or use `// @ts-ignore` for midi-file imports, ensure @types packages are installed
**Warning signs:** TypeScript compilation errors mentioning Header.d.ts, Instrument.d.ts, Track.d.ts

### Pitfall 3: Losing CC Data on Export
**What goes wrong:** Exported MIDI files missing expression, sustain, modulation data that was in original
**Why it happens:** Control Change (CC) data is separate from notes; must be explicitly preserved in data model and re-added on export
**How to avoid:** When parsing, store `track.controlChanges` indexed by CC number. On export, use `track.addCC()` for each preserved CC event
**Warning signs:** Exported files sound "flat" in DAWs, missing dynamics/expression that original had

### Pitfall 4: Format 0 vs Format 1 Confusion
**What goes wrong:** Multi-track MIDI file exports as single track, or compatibility issues with older devices
**Why it happens:** MIDI Format 0 (single track) vs Format 1 (multi-track) affects how tracks are structured
**How to avoid:** Default to Format 1 for multi-track exports (Logic/Ableton/FL Studio preference). @tonejs/midi creates Format 1 by default when using `addTrack()`
**Warning signs:** All tracks merged in DAW after import, inability to edit individual instrument tracks

### Pitfall 5: Channel 10 Percussion Handling
**What goes wrong:** Drum tracks get interpreted as melodic instruments or vice versa
**Why it happens:** MIDI Channel 10 (index 9 in zero-based) is reserved for percussion in General MIDI standard
**How to avoid:** Check `track.channel === 9` to identify drum tracks, use different instrument detection logic for channel 10
**Warning signs:** Drum sounds playing as piano, or melodic instruments triggering drum samples

### Pitfall 6: File Validation Only by Extension
**What goes wrong:** App crashes when user renames .mp3 to .mid or uploads corrupted file
**Why it happens:** File extensions can be changed without changing content; need to validate actual file format
**How to avoid:** Check ArrayBuffer header bytes (MIDI: "MThd" = 4D 54 68 64, MusicXML: starts with "<?xml"), wrap parsing in try/catch with user-friendly errors
**Warning signs:** Uncaught exceptions on file upload, cryptic error messages to users

### Pitfall 7: Unnamed Track Handling
**What goes wrong:** UI shows empty strings or "undefined" for track names
**Why it happens:** Many MIDI files don't include track name meta events
**How to avoid:** Always provide fallback: `track.name || generateTrackName(track, index)` using instrument detection
**Warning signs:** Empty track list labels, poor UX for users trying to identify tracks

## Code Examples

Verified patterns from official sources:

### Parsing MIDI File
```typescript
// Source: @tonejs/midi GitHub README
import { Midi } from '@tonejs/midi';

async function loadMidi(file: File): Promise<Midi> {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  console.log('MIDI parsed:', {
    name: midi.header.name,
    ppq: midi.header.ppq,
    tracks: midi.tracks.length,
    duration: midi.duration,
    tempos: midi.header.tempos,
    timeSignatures: midi.header.timeSignatures
  });

  return midi;
}
```

### Parsing MusicXML File
```typescript
// Source: musicxml-interfaces GitHub README
import { parseScore } from 'musicxml-interfaces';

async function loadMusicXML(file: File): Promise<any> {
  const text = await file.text();
  const document = parseScore(text);

  console.log('MusicXML parsed:', {
    movementTitle: document['movement-title'],
    parts: document.part?.length || 0
  });

  return document;
}
```

### Creating MIDI from Scratch
```typescript
// Source: @tonejs/midi API documentation
import { Midi } from '@tonejs/midi';

function createMidiFile(): Uint8Array {
  const midi = new Midi();
  midi.header.name = 'New Composition';
  midi.header.ppq = 480; // Pulses per quarter note

  // Set tempo to 120 BPM
  midi.header.setTempo(120);

  // Add time signature 4/4
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: [4, 4]
  });

  // Create a piano track
  const track = midi.addTrack();
  track.name = 'Piano';
  track.channel = 0;
  track.instrument.number = 0; // Acoustic Grand Piano

  // Add notes (C major scale)
  const notes = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 to C5
  notes.forEach((midiNote, i) => {
    track.addNote({
      midi: midiNote,
      ticks: i * 480, // Each note is 1 quarter note apart
      durationTicks: 240, // Half the quarter note length
      velocity: 0.8
    });
  });

  return midi.toArray();
}
```

### File Download Helper
```typescript
// Source: Common browser file download pattern
function downloadMidiFile(midiData: Uint8Array, filename: string): void {
  const blob = new Blob([midiData], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.mid') ? filename : `${filename}.mid`;
  link.click();

  // Clean up
  URL.revokeObjectURL(url);
}
```

### Instrument Name Detection
```typescript
// Source: General MIDI specification + @tonejs/midi
const GM_INSTRUMENTS = [
  // Piano (0-7)
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano',
  'Honky-tonk Piano', 'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
  // Chromatic Percussion (8-15)
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone',
  'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  // ... (complete mapping to 127)
];

function getInstrumentName(programNumber: number): string {
  if (programNumber >= 0 && programNumber <= 127) {
    return GM_INSTRUMENTS[programNumber];
  }
  return 'Unknown';
}

function isPercussionTrack(track: Track): boolean {
  // Channel 10 (index 9) is always percussion in General MIDI
  return track.channel === 9;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side MIDI conversion | Client-side with @tonejs/midi | ~2018 | Eliminates server dependency, faster processing, better privacy, aligns with single-session architecture |
| Redux for all state | Zustand/Jotai for client state | 2023-2024 | Lighter bundle size, simpler API, less boilerplate for music app state |
| Hand-rolled MIDI parsers | Standardized libraries | 2015+ | Reduced bugs, better DAW compatibility, community maintenance |
| MusicXML server rendering | Client-side parsing + optional rendering | 2020+ | Faster initial load, progressive enhancement possible |
| Format 0 MIDI for simplicity | Format 1 for professional use | Always preferred in DAWs | Better track organization, easier editing in professional tools |

**Deprecated/outdated:**
- **midi-file direct usage without wrapper:** @tonejs/midi provides essential time normalization and JSON conversion
- **Synchronous file reading:** FileReader is async; use Promises or async/await
- **Assuming single tempo:** Modern MIDI files often have tempo changes; always iterate `header.tempos` array

## Open Questions

Things that couldn't be fully resolved:

1. **MusicXML to MIDI conversion best practice**
   - What we know: Multiple libraries exist (musicxml-midi, Verovio), each with different approaches
   - What's unclear: Which provides most accurate note timing and articulation conversion for this use case
   - Recommendation: Start with musicxml-interfaces for parsing, defer full conversion until needed. For v1, display MusicXML metadata but may not support full playback/editing until Phase 2+

2. **@tonejs/midi maintenance status**
   - What we know: Last published 4 years ago (version 2.0.28), but actively used in production
   - What's unclear: Whether library is stable-complete or abandoned; GitHub shows recent issues (2024-2025)
   - Recommendation: Use with caution, monitor GitHub issues, have contingency plan to fork if critical bugs appear. Consider contributing fixes upstream if needed.

3. **File size limits for browser parsing**
   - What we know: ArrayBuffer parsing is synchronous and can block UI for large files
   - What's unclear: Practical file size limits before performance degrades on typical hardware
   - Recommendation: Test with large orchestral MIDI files (10+ MB), consider Web Worker for parsing if needed

4. **Control Change (CC) data completeness**
   - What we know: @tonejs/midi exposes `track.controlChanges`, DAWs use CC for expression/dynamics
   - What's unclear: Which CC numbers are most critical to preserve for Logic/Ableton/FL Studio compatibility
   - Recommendation: Preserve all CC data in data model, prioritize testing with files containing common CCs (1=modulation, 7=volume, 10=pan, 11=expression, 64=sustain)

## Sources

### Primary (HIGH confidence)
- @tonejs/midi GitHub README - https://github.com/Tonejs/Midi/blob/master/README.md - API methods, data structures
- @tonejs/midi npm page - https://www.npmjs.com/package/@tonejs/midi - version, installation
- musicxml-interfaces GitHub - https://github.com/jocelyn-stericker/musicxml-interfaces - API documentation
- General MIDI Specification - https://www.earmaster.com/wiki/music-technology/list-of-general-midi-instruments.html - instrument program numbers
- MIDI File Format Specifications - https://midimusic.github.io/tech/midispec.html - Format 0 vs Format 1, header structure

### Secondary (MEDIUM confidence)
- Apple Support: Export MIDI in Logic Pro - https://support.apple.com/guide/logicpro/export-midi-regions-lgcp77376cad/mac - verified Format 1 preference
- MIDI timing documentation - https://majicdesigns.github.io/MD_MIDIFile/page_timing.html - ticks vs seconds calculations
- React state management 2026 - https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns - Zustand/Jotai recommendations
- FileReader API usage - https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Sending_and_Receiving_Binary_Data - ArrayBuffer patterns

### Tertiary (LOW confidence)
- @tonejs/midi GitHub Issues - https://github.com/Tonejs/Midi/issues - BPM handling bug, TypeScript declaration issues (community reports, not official docs)
- MusicXML to MIDI converters - https://github.com/infojunkie/musicxml-midi - conversion approaches (not deeply tested for this use case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @tonejs/midi is proven library with active usage, musicxml-interfaces is established parser
- Architecture: HIGH - Patterns verified from official docs and common web development practices
- Pitfalls: MEDIUM - Derived from GitHub issues, community forums, and MIDI specification edge cases; some need validation in development

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain with mature libraries)

---

**Notes for planner:**
- User has decided on track display showing track name, instrument type, note count, and duration
- User wants ticks as time representation (confirmed good choice for MIDI precision)
- User wants extensive metadata preservation (tempo, time sig, key sig, CC data, track names/colors)
- MusicXML handling strategy is Claude's discretion - recommend parse-only for v1, defer full conversion
- Auto-generated track names should use intelligent detection (e.g., "Piano Track" not "Track 1")
- Re-import should warn about unsaved changes (good UX even without persistence)
