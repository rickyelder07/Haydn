# Phase 14: MIDI Hardware Integration - Research

**Researched:** 2026-03-03
**Domain:** Web MIDI API, browser hardware input, MIDI recording, Tone.js integration
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIDI-01 | System detects Web MIDI API availability (Chrome/Edge/Opera support) | navigator.requestMIDIAccess() availability check; `typeof navigator.requestMIDIAccess !== 'undefined'` guard |
| MIDI-02 | System displays clear error if Web MIDI not supported (Firefox/Safari) | API unavailable: show specific message; NotAllowedError: show permission error |
| MIDI-03 | User can connect MIDI keyboard via "Connect MIDI" button | requestMIDIAccess() called on button click (requires user gesture for AudioContext init) |
| MIDI-04 | System lists connected MIDI input devices | midiAccess.inputs Map; enumerate with .forEach() or .values() |
| MIDI-05 | User can play notes of currently selected track using MIDI keyboard (when paused) | MIDIInput onmidimessage → decode note-on/off → triggerAttack/triggerRelease on loaded instrument |
| MIDI-06 | Keyboard input respects velocity sensitivity | message.data[2] (0–127) normalized to 0–1 range for Tone.js triggerAttack velocity param |
| MIDI-07 | Sustain pedal (CC 64) works properly | CC message (0xB0) with controller 64; sustainActive flag; defer triggerRelease while active |
| MIDI-08 | User can arm track for recording via record button in transport controls | midiInputStore.isArmed state; record button added to TransportStrip |
| MIDI-09 | User can start recording during playback (captures MIDI input as notes) | onmidimessage while isArmed && isPlaying; accumulate pendingNotes Map (midi → {startTicks}) |
| MIDI-10 | Recording includes count-in (1 bar before playback starts) | Reuse existing CountIn.ts; startWithCountIn(1) before Transport.start(); recording begins only after count-in |
| MIDI-11 | Recorded notes align with beat grid (latency compensation applied) | Convert event.timeStamp (performance.now domain) to Tone Transport ticks using timing offset formula |
| MIDI-12 | User can undo last recording (remove recorded notes) | editStore.applyBatchEdit() used to add recorded notes = single undo step; standard undo handles it |
| MIDI-13 | Recording indicator visible during active recording | midiInputStore.isRecording state; pulsing red dot in TransportStrip |
</phase_requirements>

---

## Summary

Phase 14 adds MIDI hardware keyboard support to Haydn via the Web MIDI API — a browser-native API available in Chrome, Edge, and Opera (approximately 82% global browser coverage). Firefox added support in version 108; Safari does not support the API and has no announced plans to do so. The implementation requires no additional npm dependencies: the Web MIDI API is a browser built-in, and TypeScript types are available via `@types/webmidi`.

The core architecture follows three distinct interaction modes. First, **live playback**: when the user is paused and presses keys, MIDI note-on/off messages trigger `triggerAttack` / `triggerRelease` on the already-loaded `InstrumentInstance` for the selected track. This reuses existing loaded instruments from NoteScheduler. Second, **MIDI recording**: when armed and playback is running, incoming MIDI events are timestamped and converted from `performance.now()` domain into Transport ticks using a computed offset (`(performance.now()/1000) - audioContext.currentTime`). Notes are committed to the track via `editStore.applyBatchEdit()` on recording stop, making the entire recording a single undoable step. Third, **sustain pedal handling**: a `sustainActive` flag defers note-off events until CC64 drops below 64.

All Web MIDI state lives in a new `midiInputStore` (Zustand). The store holds: MIDI access object, connected devices list, armed/recording flags, and pending notes accumulator. This follows the established pattern of Zustand stores in `src/state/`. The "Connect MIDI" UI goes in the TransportStrip (already home to play/stop/loop controls), and the recording indicator (pulsing red dot) appears adjacent to the arm button.

**Primary recommendation:** Implement `midiInputStore` as the single source of truth for all MIDI hardware state, use the timing offset formula `(performance.now()/1000) - audioContext.currentTime` for latency compensation, and reuse `editStore.applyBatchEdit()` for undo support.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web MIDI API | Browser built-in | MIDI device access, input events | Only browser-native MIDI solution; no install |
| Tone.js | 15.1.22 (already installed) | `triggerAttack`/`triggerRelease` for live playing, `Transport.seconds` for position | Already the project audio engine |
| Zustand | 5.0.10 (already installed) | `midiInputStore` for MIDI state | Project-established state management pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/webmidi` | Latest | TypeScript types for Web MIDI API | Only if TypeScript can't infer; prefer inline interface declarations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw Web MIDI API | WebMIDI.js (djipco) | WebMIDI.js has SSR issues with Next.js (evaluates as Node.js environment); raw API simpler for this use case |
| Raw Web MIDI API | JZZ library | Adds ~50KB, overkill for basic note-on/off/CC recording |
| `@types/webmidi` | Inline TypeScript interfaces | Custom interfaces = no extra dependency; sufficient for 3 message types needed |

**Installation:**
```bash
# No new packages required — Web MIDI API is browser built-in
# TypeScript types: option A (preferred)
# Define inline MIDIAccess/MIDIInput interfaces in midiInputStore.ts

# TypeScript types: option B (if needed)
npm install --save-dev @types/webmidi
```

Note: `@types/webmidi` may conflict with TypeScript's own WebMIDI lib typings in tsconfig. Check `lib` array in tsconfig before installing. Inline interface declarations avoid this entirely.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── state/
│   └── midiInputStore.ts          # NEW: all MIDI hardware state + actions
├── audio/
│   └── midi/
│       └── MidiInputEngine.ts     # NEW: Web MIDI access singleton, device management, message routing
├── components/
│   └── TimelineRuler/
│       └── TransportStrip.tsx     # MODIFIED: add Record arm button + MIDI connect button + recording indicator
│   └── Midi/                      # NEW: MIDI-specific UI components
│       ├── MidiConnectButton.tsx  # Connect/disconnect + device list popover
│       └── MidiDeviceList.tsx     # Displays connected input devices
```

### Pattern 1: MidiInputEngine Singleton
**What:** A singleton class (mirrors AudioEngine/PlaybackController pattern) that wraps `navigator.requestMIDIAccess()`, manages device lifecycle, routes messages to handlers.
**When to use:** All MIDI hardware access goes through this class. Components never call `navigator.requestMIDIAccess` directly.

```typescript
// Source: MDN Web MIDI API + project AudioEngine pattern
class MidiInputEngine {
  private static instance: MidiInputEngine | null = null;
  private midiAccess: MIDIAccess | null = null;
  private messageHandlers: Set<(event: MIDIMessageEvent) => void> = new Set();

  static getInstance(): MidiInputEngine {
    if (!MidiInputEngine.instance) {
      MidiInputEngine.instance = new MidiInputEngine();
    }
    return MidiInputEngine.instance;
  }

  async requestAccess(): Promise<void> {
    if (typeof navigator.requestMIDIAccess === 'undefined') {
      throw new Error('Web MIDI API not supported in this browser');
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.attachInputListeners();

      // Device hot-plug/unplug
      this.midiAccess.onstatechange = (event) => {
        this.handleStateChange(event as MIDIConnectionEvent);
      };
    } catch (err) {
      if ((err as DOMException).name === 'NotAllowedError') {
        throw new Error('MIDI access denied. Please allow MIDI access in your browser settings.');
      }
      throw err;
    }
  }

  private attachInputListeners(): void {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        this.messageHandlers.forEach(handler => handler(event));
      };
    });
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    // Re-attach listeners on new device connection
    this.attachInputListeners();
    // Notify store of device list change
    getMidiInputStore().getState().refreshDevices(this.midiAccess);
  }

  getInputDevices(): MIDIInput[] {
    if (!this.midiAccess) return [];
    return Array.from(this.midiAccess.inputs.values());
  }

  addMessageHandler(handler: (event: MIDIMessageEvent) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  dispose(): void {
    this.midiAccess?.inputs.forEach(input => {
      input.onmidimessage = null;
    });
    this.midiAccess = null;
  }
}
```

### Pattern 2: MIDI Message Decoder
**What:** Pure function that decodes raw Uint8Array MIDI bytes into structured events.
**When to use:** Used by midiInputStore to interpret every incoming MIDI message.

```typescript
// Source: MDN Web MIDI API, Smashing Magazine MIDI article
interface MidiNoteEvent {
  type: 'noteOn' | 'noteOff';
  midi: number;         // 0-127
  velocity: number;     // 0-127 raw (normalize to 0-1 for Tone.js)
  timestamp: number;    // DOMHighResTimeStamp (same domain as performance.now())
}

interface MidiCCEvent {
  type: 'controlChange';
  controller: number;   // 0-127 (64 = sustain pedal)
  value: number;        // 0-127
  timestamp: number;
}

type MidiEvent = MidiNoteEvent | MidiCCEvent;

function decodeMidiMessage(event: MIDIMessageEvent): MidiEvent | null {
  const [statusByte, data1, data2] = event.data;
  const command = statusByte & 0xF0;  // High nibble = command type
  // const channel = statusByte & 0x0F; // Low nibble = channel (0-15)

  if (command === 0x90) { // Note On
    const velocity = data2 ?? 0;
    if (velocity === 0) {
      // Velocity 0 on Note On = Note Off (MIDI running status convention)
      return { type: 'noteOff', midi: data1, velocity: 0, timestamp: event.timeStamp };
    }
    return { type: 'noteOn', midi: data1, velocity, timestamp: event.timeStamp };
  }

  if (command === 0x80) { // Note Off
    return { type: 'noteOff', midi: data1, velocity: data2 ?? 0, timestamp: event.timeStamp };
  }

  if (command === 0xB0) { // Control Change
    return { type: 'controlChange', controller: data1, value: data2 ?? 0, timestamp: event.timeStamp };
  }

  return null; // Ignore other message types (pitch bend, program change, etc.)
}
```

### Pattern 3: midiInputStore (Zustand)
**What:** Central state for MIDI hardware. Handles live play routing + recording accumulation.
**When to use:** All MIDI state reads/writes go through this store. Components subscribe to relevant slices.

```typescript
// Source: project Zustand store pattern (playbackStore.ts)
interface MidiInputState {
  // Connection state
  isSupported: boolean | null;   // null = not checked yet
  isConnected: boolean;
  devices: string[];             // device names for display
  error: string | null;

  // Recording state
  isArmed: boolean;
  isRecording: boolean;
  recordingStartTicks: number;   // Transport ticks when recording began
  pendingNotes: Map<number, { startTicks: number; velocity: number }>;
  // midi number → note start for notes currently held down

  // Sustain pedal state
  sustainActive: boolean;
  sustainedNoteOffs: Set<number>; // midi numbers with deferred note-off

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshDevices: (access: MIDIAccess | null) => void;
  setArmed: (armed: boolean) => void;
  startRecording: () => void;
  stopRecording: () => HaydnNote[]; // returns recorded notes
  handleMidiEvent: (event: MidiEvent) => void;
}
```

### Pattern 4: Timing Offset for Latency Compensation
**What:** Convert `MIDIMessageEvent.timeStamp` (in `performance.now()` domain, milliseconds) to Tone.js Transport ticks.
**When to use:** Every time a note-on timestamp needs to be stored as ticks for recording.

```typescript
// Source: Tone.js issue #840, Tone.js AudioContext relationship
// MIDIMessageEvent.timeStamp is in performance.now() domain (milliseconds)
// Tone.js audioContext.currentTime is in seconds, starts at page load

function midiTimestampToTransportTicks(
  midiTimestamp: number,    // from MIDIMessageEvent.timeStamp (ms)
  ppq: number,              // project PPQ (e.g. 480)
  bpm: number               // current Transport BPM
): number {
  // Step 1: Convert midiTimestamp to seconds
  const midiTimeSeconds = midiTimestamp / 1000;

  // Step 2: Get the offset between performance.now() and audioContext.currentTime
  // Both count from page load but audioContext may start slightly later
  const audioContext = Tone.getContext().rawContext as AudioContext;
  const timingOffsetSeconds = (performance.now() / 1000) - audioContext.currentTime;

  // Step 3: Convert to audioContext time domain
  const eventAudioTime = midiTimeSeconds - timingOffsetSeconds;

  // Step 4: Convert elapsed transport time to ticks
  // Transport.seconds = time elapsed since Transport.start()
  const transportStartAudioTime = audioContext.currentTime - Transport.seconds;
  const elapsedTransportSeconds = eventAudioTime - transportStartAudioTime;

  // Step 5: Convert seconds to ticks at current BPM
  const ticks = Math.round((elapsedTransportSeconds * bpm / 60) * ppq);
  return Math.max(0, ticks);
}
```

Note: This formula works for single-tempo projects. The project already has `secondsToTicks()` in `timeConversion.ts` for tempo-map-aware conversion which should be used when available.

### Pattern 5: Live Note Playback with Sustain
**What:** Route MIDI note events to the currently loaded instrument for immediate audio feedback. Sustain pedal defers note-off.
**When to use:** When not recording (paused state) and a MIDI device is connected.

```typescript
// Source: Tone.js Sampler/PolySynth docs, MIDI CC64 spec
// Note: InstrumentInstance interface needs triggerAttack/triggerRelease added

function handleLivePlayMidiEvent(event: MidiEvent, instrument: InstrumentInstance): void {
  const noteName = midiToNoteName(event.midi); // existing utility

  if (event.type === 'noteOn') {
    instrument.triggerAttack(noteName, Tone.now(), event.velocity / 127);
  } else if (event.type === 'noteOff') {
    if (!sustainActive) {
      instrument.triggerRelease(noteName, Tone.now());
    } else {
      // Defer release until sustain pedal lifts
      sustainedNoteOffs.add(event.midi);
    }
  } else if (event.type === 'controlChange' && event.controller === 64) {
    if (event.value >= 64) {
      sustainActive = true;
    } else {
      sustainActive = false;
      // Release all deferred notes
      sustainedNoteOffs.forEach(midi => {
        instrument.triggerRelease(midiToNoteName(midi), Tone.now());
      });
      sustainedNoteOffs.clear();
    }
  }
}
```

**CRITICAL:** The existing `InstrumentInstance` interface (`PianoSampler.ts`) only has `triggerAttackRelease`. To support live playing, the interface must be extended with optional `triggerAttack(note, time, velocity)` and `triggerRelease(note, time)` methods. Both `Sampler` and `PolySynth` from Tone.js support these methods natively.

### Pattern 6: Recording Session Lifecycle
**What:** Start/stop recording lifecycle that accumulates notes and commits them atomically.
**When to use:** MIDI-08 through MIDI-12 implementation.

```typescript
// State transitions:
// idle → armed (user clicks record button)
// armed → recording (playback starts, after count-in)
// recording → idle (stop clicked, or playback ends)

// On recording stop:
function stopAndCommitRecording(): HaydnNote[] {
  // Close any still-held notes (key still down when stop pressed)
  const now = getCurrentTransportTicks();
  const notes: HaydnNote[] = [];

  pendingNotes.forEach(({ startTicks, velocity }, midi) => {
    notes.push({
      midi,
      ticks: startTicks,
      durationTicks: Math.max(now - startTicks, ppq / 16), // min 1/64 note
      velocity: velocity / 127,
    });
  });
  pendingNotes.clear();

  // Commit to editStore as single undo step
  if (notes.length > 0) {
    const existingNotes = projectStore.getState().project.tracks[selectedTrackIndex].notes;
    const mergedNotes = [...existingNotes, ...notes].sort((a, b) => a.ticks - b.ticks);
    editStore.getState().applyBatchEdit(mergedNotes);
  }

  return notes;
}
```

### Anti-Patterns to Avoid
- **Direct navigator.requestMIDIAccess() in components:** Creates cleanup/lifecycle issues; always route through MidiInputEngine singleton.
- **Re-requesting MIDI access on every note:** `requestMIDIAccess()` is a one-time call; attach `onstatechange` for device changes.
- **Treating velocity 0 note-on as a real note:** MIDI running status sends velocity-0 note-on as note-off; MUST handle this case.
- **Using `Tone.now()` directly from MIDI timestamp:** `Tone.now()` returns AudioContext time; MIDI timestamps are `performance.now()` domain — they are NOT the same value and require offset calculation.
- **Calling Web MIDI API in server-side render:** `navigator` is undefined on server; always guard with `typeof window !== 'undefined'` and put in `'use client'` components or useEffect.
- **Adding recording state to playbackStore:** Keep MIDI state separate in `midiInputStore`; playbackStore is transport-only per established project pattern.
- **WebMIDI.js library with Next.js SSR:** The library detects Node.js environment and throws `perf_hook` module errors during SSR compilation. Use raw Web MIDI API instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Note name from MIDI number | Custom converter | Existing `midiToNoteName()` in `timeConversion.ts` | Already in codebase, handles all 128 notes |
| Count-in before recording | Custom countdown | Existing `CountIn.ts` / `startWithCountIn()` | Already handles BPM-aware beat counting + cancellation |
| Single undo step for recording | Custom history | `editStore.applyBatchEdit()` | HistoryManager already handles batch edits as single undo entry |
| Ticks ↔ seconds conversion | Custom formula | Existing `secondsToTicks()` in `timeConversion.ts` | Handles tempo map changes correctly |
| Transport start/stop | Custom scheduling | Existing `PlaybackController` + `playbackStore` | Already manages Tone.Transport with state notifications |
| Note-on velocity normalization | Divide by 127 inline everywhere | One helper function `midiVelocityToNormalized(v: number): number` | Centralize to avoid off-by-one (127 not 128) |

**Key insight:** The project's existing audio, editing, and state infrastructure handles 80% of what recording needs. The new layer is thin: Web MIDI access + message routing + timing offset calculation + note accumulation.

---

## Common Pitfalls

### Pitfall 1: velocity-0 Note-On Not Treated as Note-Off
**What goes wrong:** A note gets "stuck" on — `triggerAttack` fires but `triggerRelease` never fires because the note-off came as a `0x90` (Note On) with velocity 0, which the decoder missed.
**Why it happens:** MIDI "Running Status" optimization sends Note On with velocity 0 instead of Note Off. Many hardware keyboards use this.
**How to avoid:** In `decodeMidiMessage()`, check `if (command === 0x90 && velocity === 0)` → return `noteOff`.
**Warning signs:** Notes that play but never release when testing with a physical keyboard.

### Pitfall 2: Tone.now() Used Directly for Recorded Timestamps
**What goes wrong:** Recorded notes are off by a fixed offset from where they were played, causing systematic misalignment with the beat grid.
**Why it happens:** `Tone.now()` returns AudioContext time. `MIDIMessageEvent.timeStamp` uses `performance.now()` domain. They share the same epoch (page load) but AudioContext may start slightly after page load. The offset is typically small but non-zero.
**How to avoid:** Use the offset formula: `timingOffset = (performance.now()/1000) - audioContext.currentTime`. Apply this to convert MIDI timestamps to AudioContext time before computing ticks.
**Warning signs:** Recorded notes consistently land slightly ahead or behind the beat by a fixed amount.

### Pitfall 3: Web MIDI API Called During SSR
**What goes wrong:** `TypeError: Cannot read properties of undefined (reading 'requestMIDIAccess')` during server-side render in Next.js.
**Why it happens:** `navigator` object doesn't exist in Node.js/Next.js server environment.
**How to avoid:** All Web MIDI calls must be inside `'use client'` components and inside `useEffect` or event handlers. `MidiInputEngine` must guard with `typeof window !== 'undefined'` and `typeof navigator !== 'undefined'`.
**Warning signs:** Build fails or server throws on pages that include MIDI components.

### Pitfall 4: Device List Stale After Plug/Unplug
**What goes wrong:** UI shows disconnected device as still connected (or misses new device).
**Why it happens:** `midiAccess.inputs` is a live `MIDIInputMap` that updates, but React state holding device names doesn't know. Missing `onstatechange` handler.
**How to avoid:** Attach `midiAccess.onstatechange` immediately after `requestMIDIAccess()` resolves. In handler, call `refreshDevices()` which re-reads `midiAccess.inputs` and updates Zustand state.
**Warning signs:** "Connect MIDI" shows device after disconnect, or doesn't show newly plugged device.

### Pitfall 5: Sustain Pedal Value Range
**What goes wrong:** Sustain doesn't work — notes release immediately when key is lifted even with pedal down.
**Why it happens:** Checking `cc64Value === 127` (strict) instead of `cc64Value >= 64`. Per MIDI spec, any value 64–127 means pedal down.
**How to avoid:** `if (cc64Value >= 64) { sustainActive = true; } else { sustainActive = false; }`.
**Warning signs:** Sustain works on some keyboards but not others (different pedals send 64 vs 127).

### Pitfall 6: Long Note Duration on Recording Stop
**What goes wrong:** A note held when the user clicks Stop gets recorded with a duration from noteOn tick to current tick — potentially bars long if the user held it accidentally.
**Why it happens:** `pendingNotes` still contains open notes at stop time.
**How to avoid:** Apply a maximum duration cap (e.g., 2 bars) when closing open notes on recording stop. Also, if the note duration would be negative (edge case at track boundary), discard it.
**Warning signs:** Random very-long notes appear at the end of recordings.

### Pitfall 7: Recording with No Instruments Loaded
**What goes wrong:** Notes record correctly (ticks saved) but no audio plays during recording — confusing UX.
**Why it happens:** Live playback during recording requires the selected track's instrument to be loaded in `loadedInstruments` map in NoteScheduler.
**How to avoid:** Live monitoring (hearing what you play during recording) requires routing to the NoteScheduler's loaded instrument, not creating a new one. Check `loadedInstruments` in NoteScheduler and use existing instrument reference.
**Warning signs:** Silent recording — notes appear after stop but no audio feedback during playing.

---

## Code Examples

Verified patterns from official sources:

### Checking Web MIDI Availability
```typescript
// Source: MDN Web MIDI API docs
function isWebMidiSupported(): boolean {
  return typeof window !== 'undefined' &&
         typeof navigator !== 'undefined' &&
         typeof navigator.requestMIDIAccess !== 'undefined';
}

// Full request with permission
async function requestMidiAccess(): Promise<MIDIAccess> {
  if (!isWebMidiSupported()) {
    throw new Error(
      'Web MIDI API is not supported in this browser. ' +
      'Please use Chrome, Edge, or Opera.'
    );
  }
  // This triggers the browser permission prompt
  return navigator.requestMIDIAccess({ sysex: false });
}
```

### Decoding MIDI Message Bytes
```typescript
// Source: MDN Web MIDI API docs, Smashing Magazine
// MIDI message bytes: [status, data1, data2]
// status = command (high nibble) | channel (low nibble)
function decodeMidiMessage(event: MIDIMessageEvent): MidiEvent | null {
  if (!event.data || event.data.length < 2) return null;

  const status = event.data[0];
  const data1 = event.data[1];
  const data2 = event.data.length > 2 ? event.data[2] : 0;
  const command = status & 0xF0;

  switch (command) {
    case 0x90: // Note On
      if (data2 === 0) {
        // velocity 0 = note off (running status)
        return { type: 'noteOff', midi: data1, velocity: 0, timestamp: event.timeStamp };
      }
      return { type: 'noteOn', midi: data1, velocity: data2, timestamp: event.timeStamp };
    case 0x80: // Note Off
      return { type: 'noteOff', midi: data1, velocity: data2, timestamp: event.timeStamp };
    case 0xB0: // Control Change
      return { type: 'controlChange', controller: data1, value: data2, timestamp: event.timeStamp };
    default:
      return null;
  }
}
```

### Enumerating MIDI Inputs
```typescript
// Source: MDN MIDIAccess docs
function getConnectedInputNames(access: MIDIAccess): string[] {
  const names: string[] = [];
  access.inputs.forEach((input) => {
    names.push(input.name || 'Unknown Device');
  });
  return names;
}
```

### Device State Change Handling
```typescript
// Source: MDN MIDIAccess.onstatechange docs
access.onstatechange = (event: Event) => {
  const connectionEvent = event as MIDIConnectionEvent;
  const port = connectionEvent.port;

  if (port.type === 'input') {
    if (port.state === 'connected') {
      // New input device attached — re-attach all listeners
      attachAllInputListeners(access);
    } else if (port.state === 'disconnected') {
      // Device removed — update device list
    }
    // Notify store to refresh device list
    refreshDeviceList(access);
  }
};
```

### Extending InstrumentInstance for Live Play
```typescript
// PianoSampler.ts — needs interface update
export interface InstrumentInstance {
  load(): Promise<void>;
  triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void;
  releaseAll(): void;
  dispose(): void;
  // NEW: for live MIDI playing (optional — only needed for SamplerInstrument and SynthInstrument)
  triggerAttack?(note: string, time: number, velocity: number): void;
  triggerRelease?(note: string, time: number): void;
}

// SamplerInstrument.ts — add implementations
triggerAttack(note: string, time: number, velocity: number): void {
  this.sampler?.triggerAttack(note, time, velocity);
}

triggerRelease(note: string, time: number): void {
  this.sampler?.triggerRelease(note, time);
}

// SynthInstrument.ts — add implementations
triggerAttack(note: string, time: number, velocity: number): void {
  this.synth.triggerAttack(note, time, velocity);
}

triggerRelease(note: string, time: number): void {
  this.synth.triggerRelease(note, time);
}
```

### Accessing NoteScheduler's Loaded Instruments for Live Play
```typescript
// NoteScheduler.ts — add export for live MIDI playback
// The `loadedInstruments` Map is already populated after project load
// Add a new export function:
export function getInstrumentForTrack(trackIndex: number, project: HaydnProject): InstrumentInstance | null {
  const track = project.tracks[trackIndex];
  if (!track) return null;
  const isPercussion = isPercussionChannel(track.channel);
  const key = isPercussion ? 'percussion' : track.instrumentNumber;
  return loadedInstruments.get(key) ?? null;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jazz MIDI plugin (browser extension) | Web MIDI API (native) | ~2014 Chrome 43 | No plugin required; standard API |
| WebMIDI.js for browser compatibility | Raw Web MIDI API | 2020+ | Library has SSR issues; raw API simpler for non-SysEx use |
| `@types/webmidi` npm package for types | Inline TypeScript interfaces | 2022 TypeScript improvements | Avoids dependency conflict; sufficient for limited message types |
| Firefox requiring flag | Firefox 108 full support | 2022 Firefox 108 | Firefox now a supported browser (not just Chrome/Edge) |

**Browser support reality (2026):**
- Chrome 43+: Full support
- Edge 79+: Full support
- Firefox 108+: Full support (but note: Firefox for Android version 147 still listed as unsupported in some tables — verify if mobile matters)
- Safari: No support, no announced plans — show specific error message
- iOS Safari: No support (blocks entire Apple mobile ecosystem)

**Deprecated/outdated:**
- Jazz MIDI Plugin: Do not recommend or reference; browser extension approach is dead
- WebMIDI.js v2 `WebMidi.enable()` pattern: Library has Next.js SSR compat issues; not recommended for this project
- `@types/webmidi` v2.x: Outdated; modern TypeScript projects define interfaces inline or use tsconfig `lib` options

---

## Open Questions

1. **NoteScheduler instrument exposure for live play**
   - What we know: `loadedInstruments` is a module-level `Map` in NoteScheduler.ts; it's populated after `scheduleNotes()` runs
   - What's unclear: The cleanest way to expose it for live MIDI play without creating circular deps. Current plan: add `getInstrumentForTrack()` export to NoteScheduler.ts
   - Recommendation: Add the export function; it's a read-only accessor with no side effects

2. **Recording during already-playing Transport (no count-in edge case)**
   - What we know: MIDI-10 requires count-in (1 bar) before playback starts when recording armed
   - What's unclear: If user arms recording WHILE already playing (no count-in possible), should we start recording immediately or stop+restart with count-in?
   - Recommendation: If Transport is already playing when arm is engaged, start recording immediately (no count-in possible mid-song). Count-in only applies when pressing play from stopped state.

3. **Multi-octave MIDI channel routing**
   - What we know: MIDI keyboards send on a specific MIDI channel; project tracks have channels
   - What's unclear: Should we filter by MIDI channel to match the selected track's channel, or accept all MIDI channels to the selected track?
   - Recommendation: Accept all MIDI channels — most home users set their keyboard to channel 1, and filtering would confuse users who haven't configured their keyboard. This matches GarageBand/Logic behavior.

4. **Tone.js version and triggerAttack API stability**
   - What we know: Project uses tone@15.1.22; Sampler and PolySynth have `triggerAttack`/`triggerRelease`
   - What's unclear: Exact TypeScript types for Tone.js 15.x `Frequency` and `Time` params
   - Recommendation: Use `midiToNoteName(midi)` (string, e.g., "C4") which is valid as `Frequency` type; use `Tone.now()` for time param in live playback

---

## Sources

### Primary (HIGH confidence)
- MDN Web MIDI API docs - navigator.requestMIDIAccess, MIDIInput, MIDIConnectionEvent
- MDN MIDIAccess.onstatechange - statechange event + device detection
- Tone.js GitHub source (Sampler.ts) - triggerAttack/triggerRelease method signatures
- W3C Web MIDI API specification - MIDI byte structure, CC64 spec
- caniuse.com/midi - browser support table

### Secondary (MEDIUM confidence)
- Smashing Magazine Web MIDI API article - MIDI message decoding patterns, CC64 threshold
- Tone.js issue #840 - timing offset formula `(performance.now()/1000) - audioContext.currentTime`
- GitHub web-midi-api/issues/73 - MIDIMessageEvent.timeStamp in performance.now() domain

### Tertiary (LOW confidence)
- WebMIDI.js GitHub issue #133 (Next.js SSR issues) - verified via reproduction reports, not official docs
- Tone.js PolySynth wiki - separate triggerAttack/Release patterns for live playing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Web MIDI API is well-specified; Tone.js methods verified from source; no new packages required
- Architecture: HIGH — follows established project patterns (singleton engines, Zustand stores); new concepts are thin wrappers
- Pitfalls: HIGH — velocity-0 and timing offset are well-documented MIDI programming issues; SSR guard is standard Next.js knowledge
- Timing offset formula: MEDIUM — formula from Tone.js community issue, not official docs; should be verified during implementation with a real keyboard

**Research date:** 2026-03-03
**Valid until:** 2026-06-01 (Web MIDI API is stable; browser support changing only at Safari level)
