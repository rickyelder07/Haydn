# Phase 2: Audio Playback Engine - Research

**Researched:** 2026-01-26
**Domain:** Web Audio API MIDI playback with synthesis and sampling
**Confidence:** HIGH

## Summary

Web Audio API provides precise timing for MIDI playback, but requires careful scheduling architecture to prevent drift. The standard approach uses **lookahead scheduling**: a JavaScript timer (25ms intervals) schedules audio events 100ms ahead using `AudioContext.currentTime`, tolerating main-thread delays while maintaining sample-accurate timing.

For synthesis, **Tone.js** is the de facto standard framework, offering MIDI-friendly abstractions, transport scheduling, and polyphonic samplers. Piano should use **@tonejs/piano** (Salamander Grand Piano samples, 16 velocity levels, 88 keys). Non-piano instruments can start with Tone.js oscillators (sine/square/sawtooth waves with ADSR envelopes) and later upgrade to **tonejs-instruments** samples on-demand.

Browser autoplay policies require user interaction before audio plays. Always check `audioContext.state === "suspended"` and call `resume()` from a click/keypress handler.

**Primary recommendation:** Use Tone.js with lookahead scheduling pattern, @tonejs/piano for piano tracks, oscillator synthesis for other instruments, and implement tempo changes via Transport.bpm scheduling.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tone.js | 15.1.22+ | Web Audio framework with MIDI-friendly scheduling | Industry standard for musical timing, handles clock sync automatically, familiar to audio developers |
| @tonejs/piano | latest | High-quality piano sampler | 16 velocity levels, Salamander Grand Piano samples (free), covers all 88 keys, built for Tone.js |
| @tonejs/midi | 2.0.28 (already installed) | MIDI to Tone.js JSON converter | Extracts notes, tempo events, time signatures, control changes from MIDI files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tonejs-instruments | latest | Pre-loaded GM instrument samples | Optional on-demand downloads for non-piano instruments (strings, brass, woodwinds) |
| localforage | 1.10.0+ | IndexedDB wrapper | If implementing persistent sample caching (simpler API than raw IndexedDB) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tone.js | Raw Web Audio API | More control but must implement scheduling, transport, tempo sync manually - significant complexity |
| @tonejs/piano | WebAudioFont | More instruments but lower quality, larger files, less polished |
| tonejs-instruments | Generate all samples | Better control but requires hosting/bandwidth for large sample files |

**Installation:**
```bash
npm install tone @tonejs/piano
npm install localforage  # optional for sample caching
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── audio/
│   ├── AudioEngine.ts         # Singleton managing AudioContext, Tone.Transport
│   ├── schedulers/
│   │   ├── MidiScheduler.ts   # Lookahead scheduling for MIDI events
│   │   ├── TempoScheduler.ts  # Handle tempo changes/events
│   │   └── MetronomeScheduler.ts  # Optional click track
│   ├── instruments/
│   │   ├── PianoSampler.ts    # @tonejs/piano wrapper
│   │   ├── SynthInstrument.ts # Oscillator-based synthesis
│   │   └── InstrumentFactory.ts  # Maps GM program numbers to instruments
│   ├── playback/
│   │   ├── PlaybackController.ts  # Transport control (play/pause/stop)
│   │   ├── PositionTracker.ts     # Track playhead position
│   │   └── NoteHighlighter.ts     # Emit events for UI highlighting
│   └── utils/
│       ├── timeConversion.ts  # Ticks ↔ seconds ↔ bars:beats conversion
│       └── swingQuantize.ts   # Apply swing/groove to note timing
└── stores/
    └── playbackStore.ts       # Zustand store for playback state
```

### Pattern 1: Lookahead Scheduling (CRITICAL)
**What:** JavaScript timer schedules audio events ahead using Web Audio clock
**When to use:** All MIDI playback to prevent timing drift
**Example:**
```typescript
// Source: https://web.dev/articles/audio-scheduling
class MidiScheduler {
  private lookahead = 25.0;           // Call scheduler every 25ms
  private scheduleAheadTime = 0.1;    // Schedule 100ms ahead
  private nextNoteTime = 0;
  private timerID: number | null = null;

  start(audioContext: AudioContext) {
    this.nextNoteTime = audioContext.currentTime;
    this.scheduler(audioContext);
  }

  private scheduler(audioContext: AudioContext) {
    // Schedule all notes that fall within the lookahead window
    while (this.nextNoteTime < audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentNote, this.nextNoteTime);
      this.advanceToNextNote();
    }

    // Call again after lookahead interval
    this.timerID = setTimeout(() => this.scheduler(audioContext), this.lookahead);
  }

  private scheduleNote(note: MidiNote, time: number) {
    // Use audioContext.currentTime + offset, NOT Date.now()
    instrument.triggerAttackRelease(note.name, note.duration, time, note.velocity);
  }
}
```

### Pattern 2: Autoplay Policy Compliance
**What:** Resume AudioContext after user interaction
**When to use:** On first play button click
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
async function initAudio() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Context starts suspended due to autoplay policy
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Now safe to start audio
  return audioContext;
}

// In play button handler:
playButton.addEventListener('click', async () => {
  await initAudio();
  // Start playback
});
```

### Pattern 3: Tempo Changes During Playback
**What:** Update Transport.bpm using scheduling for smooth changes
**When to use:** User adjusts tempo slider or MIDI tempo events trigger
**Example:**
```typescript
// Source: https://tonejs.github.io/docs/
import { Transport } from 'tone';

function changeTempoLive(newBpm: number) {
  // Schedule tempo change slightly ahead for smooth transition
  const now = Tone.now();
  Transport.bpm.setValueAtTime(newBpm, now + 0.1);
}

// For MIDI tempo events (ritardando/accelerando):
function applyTempoEvents(tempoEvents: TempoEvent[]) {
  tempoEvents.forEach(event => {
    Transport.bpm.setValueAtTime(event.bpm, event.time);
  });
}
```

### Pattern 4: Note Highlighting Synchronization
**What:** Use `Tone.Draw.schedule()` to sync UI updates with audio
**When to use:** Highlighting currently playing notes
**Example:**
```typescript
// Source: https://github.com/Tonejs/Tone.js/wiki/Performance
import { Draw } from 'tone';

function scheduleNoteHighlight(note: MidiNote, time: number) {
  // Schedule audio
  instrument.triggerAttack(note.name, time, note.velocity);

  // Schedule UI update (uses requestAnimationFrame internally)
  Draw.schedule(() => {
    highlightNote(note.id, true);
  }, time);

  // Schedule unhighlight at note end
  Draw.schedule(() => {
    highlightNote(note.id, false);
  }, time + note.duration);
}
```

### Pattern 5: Swing/Groove Implementation
**What:** Offset even-numbered notes (8th/16th) to create swing feel
**When to use:** Per-track swing control
**Example:**
```typescript
// Based on DAW swing conventions
function applySwing(notes: MidiNote[], swingAmount: number): MidiNote[] {
  // swingAmount: 0 = straight, 0.5 = triplet swing, 1.0 = extreme swing
  const swingRatio = 0.5 + (swingAmount * 0.25); // 0.5 to 0.75

  return notes.map((note, index) => {
    // Apply to every other 16th note (or 8th depending on grid)
    const isOffbeat = (note.ticks % (ticksPerBeat / 2)) === (ticksPerBeat / 4);

    if (isOffbeat) {
      const delay = (ticksPerBeat / 4) * swingRatio;
      return { ...note, ticks: note.ticks + delay };
    }
    return note;
  });
}
```

### Anti-Patterns to Avoid
- **Don't use `setTimeout` for audio timing** - JavaScript timers drift, use AudioContext.currentTime
- **Don't manipulate DOM in audio callbacks** - Causes jank and timing issues, use Tone.Draw.schedule()
- **Don't create multiple AudioContexts** - Browser limit (6 in Chrome), use singleton pattern
- **Don't schedule notes with Date.now()** - Use audioContext.currentTime for precise timing
- **Don't load all samples upfront** - Mobile browsers crash, load on-demand and cache

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIDI scheduling | Custom setInterval loop | Tone.Transport + lookahead pattern | JavaScript timers drift 10-100ms, Web Audio clock is sample-accurate, lookahead prevents glitches |
| Piano sampling | Download piano samples + custom sampler | @tonejs/piano | 16 velocity levels, pitch interpolation, sustain pedal support, optimized loading |
| Tempo sync | Manual BPM to seconds calculation | Tone.Transport.bpm | Handles tempo changes mid-playback, syncs scheduled events automatically |
| ADSR envelopes | Manual gain ramping | Tone.Synth or Tone.PolySynth | Built-in attack/decay/sustain/release with proper curves, handles note overlap |
| Sample caching | Raw IndexedDB API | localforage | Cross-browser compatibility, promise-based API, automatic fallback to localStorage/WebSQL |
| Time signatures | Custom bar/beat math | @tonejs/midi timeSignatures array | Extracts from MIDI, handles time signature changes mid-song |
| Audio routing | Manual GainNode connections | Tone.Channel or Tone.Volume | Proper gain staging, panning, muting with smooth ramps |

**Key insight:** Web Audio timing is deceptively complex. The "tale of two clocks" problem (JavaScript clock vs Audio clock) causes subtle drift that accumulates over time. Tone.js solves this by abstracting the lookahead scheduling pattern, which is non-trivial to implement correctly. Custom implementations typically fail after 1-2 minutes of playback.

## Common Pitfalls

### Pitfall 1: Autoplay Policy Violations
**What goes wrong:** Audio doesn't play, no error thrown, context remains suspended
**Why it happens:** Modern browsers block audio until user gesture (since Chrome 70, Oct 2018)
**How to avoid:**
- Check `audioContext.state` before playing
- Call `audioContext.resume()` in click/keypress handler
- Show UI prompt if context is suspended
**Warning signs:** Audio works in dev but fails in production, works after second click

### Pitfall 2: Timing Drift After 1-2 Minutes
**What goes wrong:** Playback starts synchronized but drifts off-beat over time
**Why it happens:** Using `setTimeout`/`setInterval` or `Date.now()` instead of `audioContext.currentTime`
**How to avoid:**
- Use lookahead scheduling pattern (25ms check, 100ms ahead)
- Schedule with `audioContext.currentTime`, never `Date.now()`
- Let Tone.Transport handle timing, don't fight it
**Warning signs:** Perfect timing for 30 seconds, then gradual desync, worse on slow machines

### Pitfall 3: Mobile Memory Crashes
**What goes wrong:** Browser tab crashes on mobile when loading samples
**Why it happens:** Mobile browsers limit memory, audio decoding is expensive
**How to avoid:**
- Load samples on-demand (per-track, not all 128 GM instruments)
- Use streaming for full songs (HTMLAudioElement, not BufferSource)
- Limit sample count (piano: every 3rd key, not all 88)
- Monitor memory with `performance.memory` (Chrome)
**Warning signs:** Works on desktop, crashes on iPhone, "aw snap" errors

### Pitfall 4: UI Jank During Playback
**What goes wrong:** Note highlighting lags behind audio, or audio stutters during UI updates
**Why it happens:** DOM manipulation in audio callback blocks audio thread
**How to avoid:**
- Use `Tone.Draw.schedule()` for UI updates (uses requestAnimationFrame)
- Keep audio and UI logic separate
- Batch UI updates (max 60fps, not per-note)
- Use CSS transforms (GPU accelerated) for playhead animation
**Warning signs:** Audio stutters when dragging slider, highlighting out of sync

### Pitfall 5: Background Tab Throttling Breaks Playback
**What goes wrong:** Playback continues for 5 minutes in background tab, then stops
**Why it happens:** Chrome throttles JavaScript timers to 1/minute after 5min inactivity
**How to avoid:**
- Use Web Audio scheduling (immune to throttling)
- Tone.js Transport runs on Web Worker (unaffected by tab throttling)
- Don't rely on `setInterval` for audio timing
- Show warning if tab backgrounded for >4 minutes
**Warning signs:** Works in foreground, stops after tab switch, resumes on focus

### Pitfall 6: Tempo Changes Cause Glitches
**What goes wrong:** Clicking notes, pops, or silence when adjusting tempo during playback
**Why it happens:** Abrupt parameter changes, not scheduling tempo transition
**How to avoid:**
- Use `Transport.bpm.setValueAtTime()` with 0.1s lookahead
- Never set `Transport.bpm.value` directly during playback
- Use `rampTo()` for gradual changes
**Warning signs:** Clean playback until tempo slider moves, artifacts on MIDI tempo events

## Code Examples

Verified patterns from official sources:

### Complete AudioEngine Singleton
```typescript
// Combines patterns from Tone.js docs and MDN best practices
import * as Tone from 'tone';
import { Piano } from '@tonejs/piano';

class AudioEngine {
  private static instance: AudioEngine;
  private piano: Piano | null = null;
  private audioContext: AudioContext;
  private initialized = false;

  private constructor() {
    this.audioContext = Tone.getContext().rawContext as AudioContext;
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Resume context (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Load piano samples
    this.piano = new Piano({
      velocities: 5  // 5 velocity levels = smaller download, 16 = best quality
    }).toDestination();

    await this.piano.load();
    this.initialized = true;
  }

  async play() {
    await this.initialize();
    Tone.Transport.start();
  }

  pause() {
    Tone.Transport.pause();
  }

  stop() {
    Tone.Transport.stop();
    this.piano?.stopAll();
  }

  setTempo(bpm: number) {
    // Schedule tempo change slightly ahead
    const now = Tone.now();
    Tone.Transport.bpm.setValueAtTime(bpm, now + 0.1);
  }
}

export default AudioEngine.getInstance();
```

### Metronome Click Track
```typescript
// Source: https://github.com/cwilso/metronome
import { Transport, start, now } from 'tone';

class Metronome {
  private synth = new Tone.MembraneSynth().toDestination();
  private eventId: number | null = null;

  start() {
    // Schedule click on every beat
    this.eventId = Transport.scheduleRepeat((time) => {
      // High pitch on downbeat, low pitch on other beats
      const isDownbeat = Transport.position.toString().startsWith('0:0:0');
      const freq = isDownbeat ? 880 : 440;
      this.synth.triggerAttackRelease(freq, '32n', time, 0.5);
    }, '4n');  // Every quarter note
  }

  stop() {
    if (this.eventId !== null) {
      Transport.clear(this.eventId);
    }
  }
}
```

### Count-in Implementation
```typescript
// Based on DAW count-in patterns
async function playWithCountIn(bars: number) {
  const beatsPerBar = Transport.timeSignature as number;
  const totalBeats = bars * beatsPerBar;

  // Create count-in click
  const metronome = new Tone.MembraneSynth().toDestination();

  // Schedule count-in beats
  for (let i = 0; i < totalBeats; i++) {
    const time = Tone.now() + i * (60 / Transport.bpm.value);
    const isDownbeat = i % beatsPerBar === 0;
    metronome.triggerAttackRelease(isDownbeat ? 880 : 440, '32n', time, 0.5);
  }

  // Start playback after count-in
  const startTime = Tone.now() + totalBeats * (60 / Transport.bpm.value);
  Transport.start(startTime);
}
```

### MIDI Tempo Events (Ritardando/Accelerando)
```typescript
// Based on @tonejs/midi tempo extraction
import { Midi } from '@tonejs/midi';
import { Transport } from 'tone';

function applyMidiTempoEvents(midiFile: Midi) {
  const { tempos, ppq } = midiFile.header;

  // Convert MIDI tempo events to Tone.js scheduling
  tempos.forEach(tempoEvent => {
    // tempoEvent.time is in seconds
    // tempoEvent.bpm is the new tempo
    Transport.bpm.setValueAtTime(tempoEvent.bpm, tempoEvent.time);
  });
}

// Example: Gradual ritardando over 4 bars
function ritardando(startBpm: number, endBpm: number, duration: number) {
  const now = Tone.now();
  // linearRampToValueAtTime creates smooth transition
  Transport.bpm.setValueAtTime(startBpm, now);
  Transport.bpm.linearRampToValueAtTime(endBpm, now + duration);
}
```

### Oscillator-Based Synthesis for Non-Piano Instruments
```typescript
// Source: https://tonejs.github.io/docs/
import { PolySynth, Synth } from 'tone';

class SynthInstrument {
  private synth: PolySynth;

  constructor(gmProgram: number) {
    // Map GM program to waveform
    const waveform = this.getWaveformForProgram(gmProgram);

    this.synth = new PolySynth(Synth, {
      oscillator: { type: waveform },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1.0
      }
    }).toDestination();
  }

  private getWaveformForProgram(program: number): string {
    // Simplified GM mapping
    if (program >= 0 && program <= 7) return 'triangle';    // Piano/Chromatic
    if (program >= 8 && program <= 15) return 'sine';       // Percussion
    if (program >= 16 && program <= 23) return 'sawtooth';  // Organ
    if (program >= 24 && program <= 31) return 'triangle';  // Guitar
    if (program >= 32 && program <= 39) return 'triangle';  // Bass
    if (program >= 40 && program <= 55) return 'sawtooth';  // Strings/Ensemble
    if (program >= 56 && program <= 79) return 'triangle';  // Brass/Reed/Pipe
    if (program >= 80 && program <= 95) return 'square';    // Synth Lead/Pad
    return 'sine';  // Sound effects
  }

  play(note: string, duration: string, time: number, velocity: number) {
    this.synth.triggerAttackRelease(note, duration, time, velocity);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ScriptProcessorNode | AudioWorklet | Chrome 66 (2018) | Custom audio processing now runs on separate thread, prevents UI jank |
| Flash-based MIDI players | Web Audio API + Tone.js | 2015-2018 | Native browser support, no plugins, mobile compatible |
| Manual sample loading | @tonejs/piano + tonejs-instruments | 2020+ | High-quality samples with pitch interpolation, optimized loading |
| Soundfont.js | Tone.js Sampler | 2018+ | Better performance, smaller file sizes, modern Web Audio patterns |
| setInterval for timing | Lookahead scheduling | 2013 (Chris Wilson article) | Prevents drift, enables precise tempo changes |

**Deprecated/outdated:**
- **ScriptProcessorNode**: Replaced by AudioWorklet, will be removed from browsers
- **webkitAudioContext**: Use standardized `AudioContext`, webkit prefix deprecated
- **Soundfont.js**: Unmaintained since 2018, use Tone.js Sampler instead
- **MIDI.js**: Last updated 2016, doesn't use modern Web Audio patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Sample storage strategy**
   - What we know: IndexedDB can store AudioBuffers as Float32Array, Cache API is recommended for new projects, localforage provides cross-browser compatibility
   - What's unclear: Trade-off between IndexedDB persistence vs session-only memory for MVP
   - Recommendation: Start with session-only (simpler), add IndexedDB caching in Phase 3 if loading times are problematic (measure first)

2. **Polyphony limits on mobile**
   - What we know: Tone.js handles polyphony automatically, mobile browsers more constrained than desktop
   - What's unclear: Exact limits per device (varies by RAM, OS version), no official specs
   - Recommendation: Start unlimited, add note stealing (oldest note first) if crashes reported (reactive, not proactive)

3. **Per-track swing implementation**
   - What we know: Swing offsets even-numbered notes, DAWs use 50-75% ratios, must preserve original MIDI for export
   - What's unclear: Best data structure for tracking both original and swung timing
   - Recommendation: Apply swing in scheduling layer only (computed property), keep source MIDI unmodified in store

4. **Live tempo adjustment smoothness**
   - What we know: `Transport.bpm.setValueAtTime()` with 0.1s lookahead works, `linearRampToValueAtTime()` for gradual changes
   - What's unclear: Perceptual smoothness of 0.1s delay when dragging slider
   - Recommendation: Start with 0.1s lookahead, reduce to 0.05s if users complain about "laggy" tempo (test with real users)

## Sources

### Primary (HIGH confidence)
- [MDN Web Audio API Advanced Techniques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) - Lookahead scheduling pattern
- [A Tale of Two Clocks (web.dev)](https://web.dev/articles/audio-scheduling) - Authoritative timing architecture article
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) - Autoplay policy, AudioParam usage
- [Tone.js Official Documentation](https://tonejs.github.io/docs/15.1.22/classes/Sampler.html) - Sampler API, Transport scheduling
- [Tone.js Performance Wiki](https://github.com/Tonejs/Tone.js/wiki/Performance) - Optimization guidelines, Draw.schedule pattern
- [@tonejs/piano GitHub](https://github.com/tambien/Piano) - Salamander samples, 16 velocity levels
- [@tonejs/midi GitHub](https://github.com/Tonejs/Midi) - Tempo extraction, MIDI to JSON conversion

### Secondary (MEDIUM confidence)
- [tonejs-instruments GitHub](https://github.com/nbrosowsky/tonejs-instruments) - 19 GM instruments, MP3/OGG/WAV support
- [Chris Wilson's Metronome Example](https://github.com/cwilso/metronome) - Reference implementation of lookahead scheduling
- [WebAudioFont GitHub](https://github.com/surikov/webaudiofont) - Alternative GM soundfont option
- [Best Free General MIDI Soundfonts 2026](https://miditoolbox.com/posts/best-free-general-midi-soundfonts-2026) - FluidR3, GeneralUser GS comparison
- [IndexedDB Audio Storage (Raymond Camden)](https://www.raymondcamden.com/2019/11/12/building-a-custom-sound-board-with-vue-and-indexeddb) - Practical sample caching patterns

### Tertiary (LOW confidence)
- Chrome autoplay policy changes (2018) - Mentioned in search results, verify with MDN autoplay guide
- Background tab throttling timing (5 minutes) - Based on Chrome documentation, may vary by version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tone.js is industry standard, @tonejs/piano widely used, well-documented
- Architecture: HIGH - Lookahead scheduling is proven pattern (10+ years), MDN-verified, used in production apps
- Pitfalls: HIGH - Autoplay policy and timing drift are well-documented, common issues in forums/GitHub

**Research date:** 2026-01-26
**Valid until:** 2026-03-26 (60 days - stable domain, Web Audio API mature spec)
