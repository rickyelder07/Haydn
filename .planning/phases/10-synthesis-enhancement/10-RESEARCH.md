# Phase 10: Synthesis Enhancement - Research

**Researched:** 2026-02-23
**Domain:** Web Audio synthesis via Tone.js — ADSR envelopes, lowpass filtering, vibrato/LFO
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Instrument Categorization**
- Default instrument (no GM program set) → piano envelope (percussive)
- Organs (GM 17-20) → sustained envelope (like strings, not piano)
- Harpsichord/clavinet (GM 7, 8, 21-24) → percussive envelope (plucked, like piano)
- Synth instruments (GM 81-104) → Claude decides mapping to closest acoustic analog
- Guitar/bass (GM 24-40) → Claude decides based on instrument physics (likely guitar = percussive, bass = somewhere between)
- Percussion (MIDI channel 9) → no envelope shaping, no filter, no vibrato

**Envelope Tuning Philosophy**
- Piano ADSR values → Claude decides (target feel: clearly percussive, not sustained)
- Strings: slow swell attack (~200-400ms) — notes bloom gradually, cinematic feel
- Brass: punchy — Claude decides exact values within "medium attack, medium sustain" range
- Velocity affects BOTH amplitude AND attack time: harder hit (higher velocity) = faster attack, not just louder
- A debug panel exposes per-instrument ADSR values for tuning during development (not shipped to end users)

**Vibrato Character**
- Delayed fade-in: vibrato appears gradually after ~150-200ms from note onset (not immediate)
- Only notes longer than ~300ms receive vibrato — short staccato string notes skip it
- Depth: expressive range ~8-10 cents
- Fixed depth regardless of note velocity
- Frequency: 4-5Hz as specified in requirements

**Filter Aggressiveness**
- Default cutoff: ~3kHz (mid-range)
- Per-instrument-category differentiation:
  - Piano: ~3.5-4kHz (preserve brightness)
  - Strings: ~2.5kHz (warmer and rounder)
  - Brass: ~3kHz
  - Organs/other sustained: ~3kHz
- Rolloff slope: -24dB/octave (4th order)
- Debug panel includes filter cutoff controls per category

### Claude's Discretion
- Exact piano ADSR values
- Synth instrument → acoustic analog mapping (pads/leads/effects)
- Guitar and bass envelope assignment within percussive/sustained spectrum
- Brass exact ADSR values within "punchy" character
- Exact vibrato fade-in curve shape (linear vs exponential ramp)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIO-01 | Piano instruments use percussive envelope (short attack, medium decay) | Per-category envelope tuning in SynthInstrument.getEnvelopeForProgram(). Piano = programs 0-7 already separated. Values to be tuned: attack ~5ms, decay ~200ms, sustain ~0.3, release ~1.2s |
| AUDIO-02 | String instruments use sustained envelope (long attack, high sustain) | Strings = programs 40-55. Attack ~250ms, decay ~100ms, sustain ~0.85, release ~1.5s. Vibrato applies to this category |
| AUDIO-03 | Brass instruments use punchy envelope (medium attack, medium sustain) | Brass = programs 56-79. Attack ~40ms, decay ~150ms, sustain ~0.6, release ~0.5s |
| AUDIO-04 | All non-percussion instruments have lowpass filter (2-5kHz cutoff) | Tone.Filter({ type: 'lowpass', frequency: X, rolloff: -24 }). Chain: synth.connect(filter) → filter.connect(vibrato or Destination). Per-category cutoff frequencies documented |
| AUDIO-05 | String instruments include subtle vibrato (4-5Hz frequency, 5-10 cent depth) | Tone.Vibrato({ frequency: 5, depth: 0.1, wet: 1.0 }). Delayed fade-in requires custom LFO wet-ramp using Tone.getContext().currentTime scheduling. Duration gate (>300ms) checked at trigger time |
| AUDIO-06 | Percussion instruments (channel 9) have no vibrato or filtering | InstrumentFactory already routes channel 9 to SynthInstrument(999). Research confirms: skip filter/vibrato chain for percussion — connect directly to Destination |
| AUDIO-07 | Instrument sounds are noticeably better than v1.0 (subjective validation) | Requires debug panel with real-time ADSR+filter sliders per instrument category. Dev-only component mounted in page.tsx when NODE_ENV !== 'production' or behind a query param |
</phase_requirements>

---

## Summary

Phase 10 enhances the existing `SynthInstrument` class (in `src/audio/instruments/SynthInstrument.ts`) by adding per-instrument lowpass filtering (Tone.Filter), string vibrato with delayed fade-in (Tone.Vibrato + custom LFO scheduling), and tuned ADSR envelopes. The project already uses Tone.js v15.1.22 with PolySynth/Synth, which provides all required primitives natively.

The signal chain changes from `PolySynth → Destination` to `PolySynth → Filter → [Vibrato (strings only)] → Destination`. For non-string instruments: `PolySynth → Filter → Destination`. Percussion stays `PolySynth → Destination` with no effects. This requires refactoring `SynthInstrument` to hold Filter and optional Vibrato instances alongside the existing PolySynth.

One critical design constraint: velocity-dependent attack time is NOT natively supported by Tone.js — velocity only scales the target amplitude of the envelope, not the attack duration (verified in source code: `Envelope.triggerAttack` calls `linearRampTo(velocity, attack, time)` where `velocity` is the ramp target and `attack` is the fixed time). Implementing velocity-affecting attack time requires a custom wrapper that calls `synth.set({ envelope: { attack: computedAttack } })` before each note trigger. This is acceptable for the MIDI playback scheduling model used in NoteScheduler (pre-scheduled notes), though it changes a global setting on the PolySynth briefly before each note fires.

**Primary recommendation:** Refactor SynthInstrument to hold Filter + optional Vibrato as instance properties, chain them in the constructor, and add a custom triggerAttackRelease that computes attack time from velocity. Add a dev-only SynthDebugPanel component for subjective ADSR/filter tuning.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tone | ^15.1.22 (already installed) | Lowpass filter, vibrato effect, LFO, PolySynth | Already in use in project. Provides Filter, Vibrato, LFO, Gain natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React state (useState) | Already installed | Debug panel sliders for real-time ADSR/filter tuning | Debug panel component |
| No new dependencies needed | — | — | All Tone.js primitives already available |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tone.Vibrato | Manual LFO + Delay | Tone.Vibrato is exactly this under the hood — no benefit to hand-rolling |
| Tone.Filter (-24dB/oct) | BiquadFilter (-12dB/oct) | BiquadFilter is thinner wrapper without rolloff control; Tone.Filter supports -12/-24/-48/-96 rolloff |
| Custom vibrato fade-in via AudioParam scheduling | Tone.Vibrato wet signal ramp | Ramping `vibrato.wet.rampTo(1, 0.15, time)` directly on the Tone Signal is the correct approach |

**Installation:**
```bash
# No new packages needed — tone is already installed at v15.1.22
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── audio/
│   └── instruments/
│       ├── SynthInstrument.ts      # MODIFIED: add filter + vibrato per instance
│       ├── InstrumentFactory.ts    # MODIFIED: update if needed for new params
│       └── PianoSampler.ts         # MODIFIED: add lowpass filter
├── components/
│   └── SynthDebugPanel/            # NEW: dev-only tuning panel
│       ├── SynthDebugPanel.tsx
│       └── index.ts
```

### Pattern 1: Signal Chain with Filter and Vibrato

**What:** PolySynth outputs to Filter, Filter outputs to Vibrato (strings only) or directly to Destination (all others).

**When to use:** All non-percussion instruments.

**Example:**
```typescript
// Source: Tone.js v15 connect/chain API (verified from source code)

// Non-string instrument signal chain:
this.synth = new PolySynth(Synth, { oscillator: { type: waveform }, envelope });
this.filter = new Filter({ type: 'lowpass', frequency: cutoffHz, rolloff: -24 });
this.synth.connect(this.filter);
this.filter.toDestination();

// String instrument signal chain (vibrato added):
this.synth = new PolySynth(Synth, { oscillator: { type: 'sawtooth' }, envelope });
this.filter = new Filter({ type: 'lowpass', frequency: 2500, rolloff: -24 });
this.vibrato = new Vibrato({ frequency: 5, depth: 0.1, wet: 0 }); // wet=0 initially
this.synth.connect(this.filter);
this.filter.connect(this.vibrato);
this.vibrato.toDestination();
```

### Pattern 2: Vibrato Delayed Fade-In

**What:** String notes start with vibrato wet=0 (dry signal), then ramp to wet=1 after ~150-200ms delay. Short notes (<300ms) never ramp at all.

**When to use:** String instrument notes only.

**Implementation approach:**
```typescript
// Source: Tone.js Param.rampTo / Signal scheduling (verified API)
triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void {
  const safeDuration = Math.max(duration, 0.05);
  this.synth.triggerAttackRelease(note, safeDuration, time, velocity);

  if (this.vibrato && safeDuration >= 0.3) {
    // Reset wet to 0 at note start, ramp to target depth after delay
    this.vibrato.wet.setValueAtTime(0, time);
    this.vibrato.wet.linearRampToValueAtTime(1.0, time + 0.18); // 180ms fade-in
  }
}
```

Note: Tone.js `Param` (which `vibrato.wet` is) supports `setValueAtTime` and `linearRampToValueAtTime` using audio context timestamps — these are audio-rate scheduled operations, not JS timers.

### Pattern 3: Velocity-to-Attack-Time Mapping

**What:** Higher velocity = shorter attack time. Tone.js velocity only scales amplitude natively, so attack time adjustment requires calling `synth.set()` before trigger.

**Confirmed behavior (from source code):**
```
// In Envelope.js triggerAttack:
this._sig.linearRampTo(velocity, attack, time);
// 'velocity' is the TARGET amplitude (0-1), 'attack' is the TIME duration (fixed)
// So velocity does NOT change attack time in native Tone.js
```

**Custom approach:**
```typescript
private computeAttackForVelocity(baseAttack: number, velocity: number): number {
  // velocity 0-1: high velocity → faster attack (shorter time)
  // Scale: velocity 1.0 = 50% of base attack, velocity 0.5 = 100% of base attack
  const factor = 1.0 - (velocity * 0.5); // range: 0.5 at v=1.0, 1.0 at v=0.0
  return baseAttack * factor;
}

triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void {
  const dynamicAttack = this.computeAttackForVelocity(this.baseAttack, velocity);
  this.synth.set({ envelope: { attack: dynamicAttack } });
  this.synth.triggerAttackRelease(note, Math.max(duration, 0.05), time, velocity);
}
```

**Caveat:** `synth.set()` applies globally to all voices. In a polyphonic context with multiple simultaneous notes at different velocities, this will cause the last-set attack to win. For MIDI playback (all notes pre-scheduled near-simultaneously), this may cause minor inaccuracies. This is an acceptable tradeoff given the CONTEXT.md's goal of "good enough to compose with."

### Pattern 4: Debug Panel — Real-Time ADSR/Filter Controls

**What:** A dev-only React panel with sliders for each instrument category's ADSR values and filter cutoff. Changes trigger `synth.set()` + `filter.frequency.value = X` in real-time.

**Integration approach:**
- Mount as an additional floating div in `page.tsx` (similar to FloatingEditPanel pattern)
- Guarded by `process.env.NODE_ENV !== 'production'` or a URL param (`?debug=synth`)
- SynthInstrument instances need to be accessible — either export them from NoteScheduler or pass update callbacks

**Update mechanism:**
```typescript
// In SynthInstrument, expose update methods:
updateEnvelope(patch: Partial<EnvelopeSettings>): void {
  this.synth.set({ envelope: patch });
}
updateFilterCutoff(hz: number): void {
  this.filter.frequency.value = hz;
}
```

### Anti-Patterns to Avoid
- **Creating Filter/Vibrato outside constructor:** Effects must be disposed with the instrument — create them in constructor, dispose in `dispose()`.
- **Using PolySynth.toDestination() when chaining effects:** If connecting through Filter, do NOT call `polySynth.toDestination()` — the output goes through filter instead. Use `synth.connect(filter)` → `filter.connect(vibrato)` → `vibrato.toDestination()`.
- **Scheduling vibrato ramp with setTimeout:** Use Tone.js `Param.setValueAtTime` / `linearRampToValueAtTime` with the scheduled audio time, not JS setTimeout — otherwise ramp fires at wrong position relative to the note.
- **Applying vibrato to short notes:** Guard with duration check (`>= 0.3s`) before scheduling wet ramp. Without this guard, the ramp fires and immediately cancels on a short staccato note, causing an audible artifact.
- **Sharing filter instances across instruments:** Each instrument category should have its own Filter instance so cutoff can be tuned independently. The NoteScheduler already reuses instrument instances by program number.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pitch modulation oscillator | Custom delay modulation | Tone.Vibrato | Already an LFO + Delay under the hood; handles all the scheduling complexity |
| Biquad lowpass filter | Web Audio API BiquadFilterNode directly | Tone.Filter | Tone.Filter adds rolloff cascading (-24dB/oct = 2 cascaded biquads), frequency Signal support |
| Wet/dry signal mixing | Custom Gain nodes | Effect.wet (built into Tone.Vibrato) | Tone effects all inherit `wet` param — no need to build a splitter/mixer |
| Audio parameter ramp scheduling | setTimeout + synth.set | Tone.Param.rampTo / setValueAtTime | Audio-rate scheduling avoids JS timer latency jitter |

**Key insight:** All required audio primitives are in Tone.js v15 already installed. The work is configuration and signal routing, not new library integration.

---

## Common Pitfalls

### Pitfall 1: vibrato.wet Ramp Scheduling at Polyphonic Boundary
**What goes wrong:** When multiple string notes fire simultaneously, each call to `triggerAttackRelease` resets `vibrato.wet.setValueAtTime(0, time)` and re-schedules the ramp. Since it's a single Vibrato instance shared across all voices, simultaneous notes will have ramp events overlapping on the same wet signal.
**Why it happens:** Tone.Vibrato is a single effect node — all voices route through it. Per-note wet scheduling conflict is unavoidable.
**How to avoid:** Accept shared vibrato behavior — the wet ramp from the most recent note will "win." This is acceptable for v1.1 quality target. Alternatively, only schedule ramp if no note is currently active (track active voice count).
**Warning signs:** Vibrato wet pulsing on chords — noticeable if two string chord notes fire 10ms apart.

### Pitfall 2: Dispose Chain — Missing Filter or Vibrato Disposal
**What goes wrong:** Calling `instrument.dispose()` only disposes the PolySynth, leaving Filter and Vibrato nodes as audio graph zombie nodes, causing memory leaks.
**Why it happens:** Filter and Vibrato are added as new instance properties — not automatically disposed by PolySynth.dispose().
**How to avoid:** Override `dispose()` in SynthInstrument to explicitly call `this.filter.dispose()` and `this.vibrato?.dispose()`.
**Warning signs:** Browser memory climbing after multiple project loads.

### Pitfall 3: PolySynth Connection Order
**What goes wrong:** Calling `new PolySynth(Synth, {...}).toDestination()` and then trying to insert a filter afterwards — the synth is already connected to Destination.
**Why it happens:** PolySynth output is wired at construction time if `toDestination()` is chained.
**How to avoid:** Never call `.toDestination()` on PolySynth when using an effect chain. Use `synth.connect(filter)` only. Verified in PolySynth source: `voice.connect(this.output)` — voices connect to `this.output`, and `this.output` routes wherever PolySynth itself is connected.
**Warning signs:** Dry signal audible at double volume (one dry path to Destination, one wet path through filter to Destination).

### Pitfall 4: velocity-to-attack `synth.set()` Timing
**What goes wrong:** Calling `synth.set({ envelope: { attack: X } })` applies immediately to all currently-active voices. For notes that are sustaining from previous beats, this changes their release behavior mid-note.
**Why it happens:** `synth.set()` is synchronous and affects all voices including currently playing ones.
**How to avoid:** The velocity-attack computation is a "good enough" approximation. Minimize attack range variation to ~50% of base value (not 100%), so the perceptual difference on active voices is subtle. For v1.1, this is acceptable.
**Warning signs:** Popping or sudden envelope jumps on sustained string pads.

### Pitfall 5: Vibrato Depth in "cents" Interpretation
**What goes wrong:** Setting `depth: 0.8` (normalRange 0-1) expecting 8 cents of modulation, but actually getting much more.
**Why it happens:** Tone.Vibrato depth controls the LFO amplitude which modulates the delay time (0 to `maxDelay` seconds). Default `maxDelay = 0.005s`. Depth 0.1 = `0.0005s` delay modulation. The pitch deviation in cents depends on frequency and this delay time — it is NOT a direct cent mapping.
**How to avoid:** Tune by ear using the debug panel rather than computing from cents. Start with default `depth: 0.1`, `wet: 1.0` and adjust. For 8-10 cent depth at middle frequencies, `depth: 0.1` at `maxDelay: 0.005` is a reasonable starting point.
**Warning signs:** Vibrato sounds too intense (warbly) at default depth 0.1 — reduce to 0.05-0.08.

### Pitfall 6: PianoSampler Missing Filter
**What goes wrong:** AUDIO-04 requires ALL non-percussion instruments to have a lowpass filter. PianoSampler (programs 0-7) is a separate class from SynthInstrument and won't get the filter automatically.
**Why it happens:** InstrumentFactory routes piano programs to PianoSampler, not SynthInstrument.
**How to avoid:** Add Filter to PianoSampler as well, using the piano-specific cutoff (~3.5-4kHz). The CONTEXT.md decision notes piano maps to percussive envelope — this affects SynthInstrument. But piano programs 0-7 go to PianoSampler, which also needs filter treatment for AUDIO-04.
**Warning signs:** Piano sounds brighter than other instruments despite filter requirement.

---

## Code Examples

Verified patterns from official sources and installed package (tone v15.1.22):

### Tone.Vibrato Defaults (from installed package getDefaults())
```typescript
// Source: node_modules/tone/build/esm/effect/Vibrato.js getDefaults()
{
  wet: 1,           // NormalRange (0-1) — fully effected by default
  maxDelay: 0.005,  // seconds — max delay time (affects pitch range)
  frequency: 5,     // Hz — vibrato rate
  depth: 0.1,       // NormalRange — LFO amplitude (modulates delay 0 to maxDelay)
  type: "sine"      // oscillator waveform
}
```

### Tone.Filter Defaults (from installed package getDefaults())
```typescript
// Source: node_modules/tone/build/esm/component/filter/Filter.js getDefaults()
{
  Q: 1,
  detune: 0,
  frequency: 350,   // Hz — cutoff (we'll set to 2500-4000 per category)
  gain: 0,
  rolloff: -12,     // dB/oct — we want -24 (2 cascaded biquads)
  type: "lowpass"
}
```

### Signal Chain Setup (with Vibrato)
```typescript
import { PolySynth, Synth, Filter, Vibrato } from 'tone';

// String instrument with vibrato:
const synth = new PolySynth(Synth, {
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.25, decay: 0.1, sustain: 0.85, release: 1.5 }
});
const filter = new Filter({ type: 'lowpass', frequency: 2500, rolloff: -24 });
const vibrato = new Vibrato({ frequency: 5, depth: 0.1, wet: 0 }); // wet=0 initially

synth.connect(filter);
filter.connect(vibrato);
vibrato.toDestination();
```

### Signal Chain Setup (no Vibrato)
```typescript
import { PolySynth, Synth, Filter } from 'tone';

// Piano/brass/organ instruments (no vibrato):
const synth = new PolySynth(Synth, { oscillator: { type: 'triangle' }, envelope });
const filter = new Filter({ type: 'lowpass', frequency: 3500, rolloff: -24 });

synth.connect(filter);
filter.toDestination();
```

### Vibrato Delayed Fade-In Scheduling
```typescript
// Source: Tone.js Param API (setValueAtTime/linearRampToValueAtTime)
// audio 'time' is a Tone-scheduled time (from Transport)
triggerAttackRelease(note: string, duration: number, time: number, velocity: number): void {
  const safeDuration = Math.max(duration, 0.05);
  this.synth.triggerAttackRelease(note, safeDuration, time, velocity);

  if (this.vibrato && safeDuration >= 0.3) {
    this.vibrato.wet.cancelScheduledValues(time);
    this.vibrato.wet.setValueAtTime(0, time);
    this.vibrato.wet.linearRampToValueAtTime(1.0, time + 0.18); // 180ms fade-in
  }
}
```

### Dispose with Effect Cleanup
```typescript
dispose(): void {
  this.synth.dispose();
  this.filter.dispose();
  this.vibrato?.dispose();
}
```

### Debug Panel Instrument Update Methods
```typescript
// On SynthInstrument, expose tuning methods:
updateEnvelope(patch: Partial<EnvelopeSettings>): void {
  this.synth.set({ envelope: patch });
}
updateFilterCutoff(hz: number): void {
  this.filter.frequency.value = hz;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PolySynth → Destination (existing v1.0) | PolySynth → Filter → Vibrato → Destination | Phase 10 | Adds warmth (filter) and expression (vibrato) |
| Flat velocity (amplitude only) | Velocity → amplitude + attack time | Phase 10 | More dynamic, realistic instrument feel |
| Shared envelope across all GM programs | Per-category ADSR presets (piano/strings/brass/organ/synth) | Phase 10 | Instruments sound distinctly different |

**Deprecated/outdated:**
- `new PolySynth(Synth, {...}).toDestination()` in SynthInstrument constructor — this pattern is correct for simple use but incompatible with filter chaining. Must be removed and replaced with `synth.connect(filter)` approach.

---

## Open Questions

1. **Vibrato wet ramp on polyphonic string chords**
   - What we know: Vibrato is a single instance per SynthInstrument; wet param is shared.
   - What's unclear: Whether multiple near-simultaneous notes cause audible wet-ramp artifacts.
   - Recommendation: Accept the shared wet behavior for v1.1. Test with a string chord — if artifacts are noticeable, add a short debounce on wet ramp scheduling.

2. **Velocity-to-attack-time impact on sustained polyphonic notes**
   - What we know: `synth.set()` is global and immediate.
   - What's unclear: Magnitude of perceptual impact on active string pads when attack changes mid-note.
   - Recommendation: Keep velocity attack scaling conservative (±30-50% of base attack, not ±100%) and tune via debug panel. The impact on sustaining notes is primarily on the envelope's attack phase — once in sustain, changing attack has no audible effect.

3. **PianoSampler filter integration**
   - What we know: AUDIO-04 covers ALL non-percussion instruments. PianoSampler is a separate class from SynthInstrument and currently wraps PolySynth without effects.
   - What's unclear: Whether PianoSampler needs the full refactor or just a simple filter addition.
   - Recommendation: Add Filter to PianoSampler using the same pattern (synth.connect(filter) → filter.toDestination()). No vibrato needed for piano.

4. **Debug panel access mechanism**
   - What we know: SynthInstrument instances are held inside NoteScheduler's module-level `loadedInstruments` Map.
   - What's unclear: How the debug panel React component accesses live SynthInstrument instances to call updateEnvelope/updateFilterCutoff.
   - Recommendation: Export a `getSynthInstruments()` function from NoteScheduler (similar to `getLoadedInstrumentCount()` that already exists). The debug panel calls this to get live references and calls update methods directly.

---

## Recommended ADSR Values (Claude's Discretion)

### Piano (GM 0-7) — Percussive
```
attack: 0.005s, decay: 0.25s, sustain: 0.3, release: 1.2s
```
- Fast hammer strike, moderate decay, low sustain (key-up release dominates)

### Strings (GM 40-55) — Slow Swell
```
attack: 0.25s, decay: 0.1s, sustain: 0.85, release: 1.5s
```
- Bow engagement bloom, near-full sustain, long cinematic tail

### Brass (GM 56-79) — Punchy
```
attack: 0.04s, decay: 0.15s, sustain: 0.65, release: 0.5s
```
- Quick tongue articulation, good body, medium tail

### Organs (GM 17-24 — including harpsichord/clavinet to sustain group per decisions)
Note: CONTEXT.md places organs at GM 17-20 → sustained; harpsichord/clavinet (GM 7, 8, 21-24) → percussive.
```
Organ: attack: 0.01s, decay: 0s, sustain: 1.0, release: 0.2s
Harpsichord/clavinet: attack: 0.003s, decay: 0.2s, sustain: 0.1, release: 0.6s
```

### Guitar (GM 24-31) — Percussive-leaning
```
attack: 0.008s, decay: 0.3s, sustain: 0.4, release: 0.8s
```
- Pluck attack, medium decay, moderate sustain

### Bass (GM 32-39) — Between percussive and sustained
```
attack: 0.015s, decay: 0.1s, sustain: 0.75, release: 0.6s
```
- Slightly softer attack than guitar, strong body

### Synth Pads/Leads (GM 80-104) — Pad-like sustained
```
Pads (88-95): attack: 0.3s, decay: 0.2s, sustain: 0.8, release: 2.0s
Leads (80-87): attack: 0.01s, decay: 0.1s, sustain: 0.7, release: 0.8s
Effects/ethnic (96-127): attack: 0.1s, decay: 0.3s, sustain: 0.5, release: 1.5s
```

---

## Sources

### Primary (HIGH confidence)
- Tone.js v15.1.22 installed package source — `node_modules/tone/build/esm/effect/Vibrato.js` — vibrato defaults, LFO/Delay architecture
- Tone.js v15.1.22 installed package source — `node_modules/tone/build/esm/component/envelope/Envelope.js` — confirmed velocity scales amplitude NOT attack time
- Tone.js v15.1.22 installed package source — `node_modules/tone/build/esm/instrument/PolySynth.js` — voice connection model (`voice.connect(this.output)`)
- `node_modules/tone/build/esm/effect/Vibrato.js` getDefaults() — frequency: 5, depth: 0.1, maxDelay: 0.005, wet: 1
- `node_modules/tone/build/esm/component/filter/Filter.js` getDefaults() — frequency: 350, rolloff: -12, type: lowpass, Q: 1

### Secondary (MEDIUM confidence)
- [Tone.js Filter docs v14.7.77](https://tonejs.github.io/docs/14.7.77/Filter) — rolloff values (-12, -24, -48, -96), chaining API
- [Tone.js Vibrato docs v15.0.4](https://tonejs.github.io/docs/15.0.4/classes/Vibrato.html) — VibratoOptions interface (depth: NormalRange, frequency: Frequency, wet: NormalRange)
- [Tone.js PolySynth docs v15.1.22](https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html) — set() API for envelope updates
- [VibratoOptions interface](https://tonejs.github.io/docs/14.7.38/interface/VibratoOptions) — field types confirmed

### Tertiary (LOW confidence)
- Web search results confirming vibrato architecture — "LFO modulates delayTime of a Delay node"

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library APIs verified from installed package source code
- Architecture: HIGH — signal chain patterns verified from PolySynth source (voice.connect(this.output))
- ADSR values: MEDIUM — starting points based on acoustic instrument physics, require debug panel tuning
- Vibrato depth in cents: LOW — mapping from normalRange to cents is indirect (delay-based, frequency-dependent)

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (Tone.js API is stable; filter/vibrato classes unchanged across v14-v15)
