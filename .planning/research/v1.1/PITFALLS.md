# Pitfalls Research: v1.1 Polish & Enhancement

**Research Date:** 2026-02-12
**Focus:** Common mistakes when adding UI polish, synthesis improvements, AI composition, MIDI hardware

---

## Overview

v1.0 shipped successfully without major regressions. v1.1 adds complexity that can break existing functionality if not handled carefully. This document catalogs failure modes and prevention strategies.

---

## 1. UI Redesign Pitfalls

### Pitfall 1.1: Layout Shift Breaking Existing Components

**What breaks:**
- Existing components expect specific parent structure
- CSS selectors relying on DOM hierarchy break
- Canvas sizing calculations assume fixed parents

**Warning signs:**
- Piano roll doesn't fill available space
- TrackList rendering at wrong size
- Scroll containers nested incorrectly (double scrollbars)

**Prevention:**
- Test all existing components after layout change
- Use CSS Grid/Flexbox (not absolute positioning)
- Measure canvas size dynamically (`getBoundingClientRect()`)

**Phase assignment:** Phase 1 (UI Redesign)

---

### Pitfall 1.2: Resizable Panel State Conflicts

**What breaks:**
- Panel width stored in localStorage conflicts with Zustand state
- Race condition: localStorage loads after initial render
- Users resize, refresh, width resets (frustrating UX)

**Warning signs:**
- Panel "jumps" to different width on page load
- Drag handle doesn't update stored width
- Multiple sources of truth for sidebar width

**Prevention:**
- Single source of truth: react-resizable-panels handles persistence
- Don't duplicate state in Zustand
- Use library's `onLayout` callback for side effects only

**Phase assignment:** Phase 1 (UI Redesign)

---

### Pitfall 1.3: Timeline Scrubber Performance Degradation

**What breaks:**
- Mouse move events fire 60+ times/second during drag
- Updating playback position on every mousemove causes audio glitches
- Store updates trigger unnecessary re-renders

**Warning signs:**
- Audio stutters during playhead drag
- UI freezes during scrubbing
- High CPU usage when dragging

**Prevention:**
- Throttle/debounce mousemove updates (16ms = 60fps max)
- Update audio position only on mouseup (preview only)
- Use `requestAnimationFrame` for visual updates
- Separate visual state (local) from playback state (store)

**Example:**
```typescript
const handleMouseMove = throttle((e: MouseEvent) => {
  // Visual update only (local state)
  setVisualPlayheadPosition(calculateTicks(e.clientX))
}, 16)

const handleMouseUp = (e: MouseEvent) => {
  // Commit to store once
  playbackStore.seek(visualPlayheadPosition)
}
```

**Phase assignment:** Phase 1 (UI Redesign)

---

### Pitfall 1.4: Inline Editing Keyboard Trap

**What breaks:**
- User types track name, presses Space → playback starts (keyboard shortcut conflict)
- Escape to cancel edit → also cancels playback
- Enter to confirm → also triggers other UI actions

**Warning signs:**
- Unexpected playback behavior while editing names
- Can't type certain characters (shortcuts intercept)
- Focus trap (can't exit edit mode with keyboard)

**Prevention:**
- Stop keyboard shortcut propagation when editing
- Use `e.stopPropagation()` in input handlers
- Explicit "editing mode" flag in store
- Visual indicator when shortcuts disabled

**Example:**
```typescript
<input
  onKeyDown={(e) => {
    e.stopPropagation() // Prevent shortcuts
    if (e.key === 'Escape') {
      cancelEdit()
      e.preventDefault()
    }
  }}
/>
```

**Phase assignment:** Phase 1 (UI Redesign)

---

## 2. Synthesis Quality Pitfalls

### Pitfall 2.1: Breaking Existing MIDI Playback

**What breaks:**
- New envelope settings cause notes to cut off mid-playback
- Filter cutoff too low → notes sound muffled
- Vibrato too aggressive → sounds out of tune

**Warning signs:**
- Existing MIDI files sound worse than v1.0
- User complaints about "bad update"
- Notes don't sustain properly

**Prevention:**
- A/B test with v1.0 MIDI files before shipping
- Conservative parameter changes (small adjustments)
- Per-instrument configuration (not global changes)
- Feature flag for new synthesis (allow rollback)

**Testing checklist:**
- [ ] Piano sounds better (not just different)
- [ ] Strings sustain properly
- [ ] Drums maintain punch
- [ ] No clipping/distortion
- [ ] All GM instruments tested

**Phase assignment:** Phase 2 (Audio Quality)

---

### Pitfall 2.2: Tone.js Filter Memory Leaks

**What breaks:**
- Creating new Filter nodes on every note → memory leak
- Long playback sessions cause browser slowdown/crash
- Filter envelope not cleaned up after note release

**Warning signs:**
- Memory usage grows during playback
- Browser performance degrades over time
- "Out of memory" errors in long sessions

**Prevention:**
- Reuse Filter nodes per instrument (not per note)
- Properly dispose Tone.js nodes: `synth.dispose()`
- Monitor memory in DevTools during long playback tests

**Example:**
```typescript
// BAD: New filter per note
function playNote(midi, velocity) {
  const synth = new Tone.Synth()
  const filter = new Tone.Filter(2000, 'lowpass') // LEAK
  synth.connect(filter).toDestination()
}

// GOOD: Filter created once per instrument
const synth = new Tone.Synth().connect(sharedFilter).toDestination()
```

**Phase assignment:** Phase 2 (Audio Quality)

---

### Pitfall 2.3: Vibrato Tuning Issues

**What breaks:**
- Vibrato depth too high → sounds out of tune with scale
- Vibrato frequency wrong → sounds seasick
- Vibrato applied to drums → weird pitch wobble

**Warning signs:**
- Notes sound "off" even when in-scale
- Validation rejects valid notes
- Percussion instruments have pitch modulation

**Prevention:**
- Subtle vibrato only (5-10 cents depth max)
- Disable vibrato for percussion (channel 9)
- Test with ValidationPipeline (ensure scale compliance)

**Phase assignment:** Phase 2 (Audio Quality)

---

## 3. AI Composition Mode Pitfalls

### Pitfall 3.1: ValidationPipeline Bypass

**What breaks:**
- GPT-4o generates musically invalid MIDI
- ValidationPipeline not applied to AI-generated output
- Users get harsh errors instead of graceful handling

**Warning signs:**
- AI-generated MIDI fails music theory validation
- Out-of-scale notes in generated tracks
- Genre rules violated

**Prevention:**
- ALWAYS run AI output through ValidationPipeline
- Retry with GPT-4o if validation fails (up to 3 attempts)
- Fallback to template mode on repeated failures
- Never bypass validation for "AI mode"

**Example:**
```typescript
const midiJSON = await generateWithAI(prompt)
const validation = validateProject(midiJSON)

if (!validation.ok) {
  // Retry with validation errors as context
  const retryPrompt = `Previous attempt failed validation: ${validation.errors.join(', ')}. Please fix.`
  const retryJSON = await generateWithAI(retryPrompt)
  // ... (up to 3 retries)
}
```

**Phase assignment:** Phase 3 (Generation Improvements)

---

### Pitfall 3.2: Token Cost Explosion

**What breaks:**
- User asks vague question → GPT asks 3 questions → user gives long answers
- Conversation history grows exponentially
- Single generation costs $5+ (user surprise, anger)

**Warning signs:**
- Token usage > 10,000 per generation
- User complaints about costs
- Context length approaching GPT-4o limits (128k tokens)

**Prevention:**
- Hard limit on conversation length (3 Q&A pairs max)
- Truncate long user answers (500 chars max per response)
- Display running cost estimate BEFORE generation
- Confirmation dialog if cost > $1.00

**Example:**
```typescript
if (estimatedCost > 1.00) {
  const confirmed = confirm(`This generation will cost ~$${estimatedCost.toFixed(2)}. Continue?`)
  if (!confirmed) return
}
```

**Phase assignment:** Phase 3 (Generation Improvements)

---

### Pitfall 3.3: GPT-4o Output Schema Drift

**What breaks:**
- GPT-4o ignores JSON schema, returns freeform text
- GPT-4o hallucinates extra fields not in schema
- Schema validation fails, generation aborts

**Warning signs:**
- JSON parsing errors
- Schema validation failures
- GPT-4o apologizes instead of generating ("I cannot generate MIDI")

**Prevention:**
- Use `response_format: { type: 'json_schema' }` (strict mode)
- Zod schema matches OpenAI schema exactly
- System prompt emphasizes "output ONLY valid JSON"
- Retry logic with clearer instructions

**Testing:**
- Test with ambiguous prompts (edge cases)
- Test with prompts outside music domain (should refuse gracefully)

**Phase assignment:** Phase 3 (Generation Improvements)

---

### Pitfall 3.4: Question Loop Infinity

**What breaks:**
- GPT-4o asks question → user answers → GPT asks follow-up → infinite loop
- User can't escape question flow
- "Generate" button never appears

**Warning signs:**
- More than 3 questions asked
- Users report "stuck in questions"
- No clear path to generation

**Prevention:**
- Hard limit: 3 questions maximum (enforced in API route)
- "Skip questions" button always visible
- After 3 questions, force generation (no more questions)

**Example:**
```typescript
const MAX_QUESTIONS = 3
if (conversationHistory.filter(m => m.role === 'assistant').length >= MAX_QUESTIONS) {
  // Force generation, no more questions
  return generateMIDI(conversationHistory)
}
```

**Phase assignment:** Phase 3 (Generation Improvements)

---

## 4. Template Generation Pitfalls

### Pitfall 4.1: Random Variation Breaking Genre Consistency

**What breaks:**
- Jazz verse uses trap drum pattern (cross-genre contamination)
- Classical chorus has jazz swing (style mismatch)
- Random pattern selection picks wrong genre template

**Warning signs:**
- Generated MIDI sounds "wrong" for genre
- User feedback: "This doesn't sound like [genre]"
- Validation warnings about genre rule violations

**Prevention:**
- Patterns strictly scoped per genre (no cross-contamination)
- Validation after pattern assembly (genre rules enforced)
- Manual curation of all pattern variations (no procedural generation)

**Testing:**
- Generate 100 examples per genre
- Listen to all variations
- Ensure genre consistency across variations

**Phase assignment:** Phase 3 (Generation Improvements)

---

### Pitfall 4.2: Seeded Randomness Not Reproducible

**What breaks:**
- User generates MIDI, loves it, refreshes page → different output
- "Generate again" produces different result (expected same)
- No way to reproduce favorite generations

**Warning signs:**
- User complaints about losing good generations
- Export/re-import doesn't match original

**Prevention:**
- Use seed-based randomness (`seedrandom` library)
- Store seed in MIDI metadata or project state
- "Regenerate with same seed" button

**Example:**
```typescript
const seed = Date.now().toString()
const rng = seedrandom(seed)
const patternIndex = Math.floor(rng() * patterns.length)

// Store seed in project metadata
project.metadata.generationSeed = seed
```

**Phase assignment:** Phase 3 (Generation Improvements)

---

## 5. Advanced Editing Pitfalls

### Pitfall 5.1: Velocity Lane Not Synced with Piano Roll

**What breaks:**
- User selects note in piano roll → velocity stalk not highlighted
- User edits velocity → piano roll note doesn't update
- Scroll offset mismatch (velocity lane doesn't track piano roll scroll)

**Warning signs:**
- Visual desync between lanes
- Editing wrong note's velocity
- User confusion about which note is selected

**Prevention:**
- Shared state for selection (editStore)
- Synchronized scroll listeners
- Same coordinate system (ticks → pixels conversion)
- Update both canvases on any change

**Example:**
```typescript
// Piano roll updates editStore selection
onNoteClick(noteId) {
  editStore.selectNote(noteId)
  // VelocityLane subscribes to editStore, re-renders automatically
}
```

**Phase assignment:** Phase 4 (Advanced Editing)

---

### Pitfall 5.2: Quantization Destroying Musical Nuance

**What breaks:**
- 100% quantization removes intentional timing variations
- Humanization patterns lost (swing, groove)
- Everything sounds robotic after quantization

**Warning signs:**
- User complaints: "Quantization made it worse"
- MIDI sounds lifeless after quantization
- Undo used immediately after quantize

**Prevention:**
- Default strength 80% (not 100%)
- "Exclude within" threshold to preserve tight notes
- Preview mode (show result before applying)
- Undo always available

**UI guidance:**
- Tooltip: "100% removes all timing variation"
- Recommended: 70-90% for natural feel

**Phase assignment:** Phase 4 (Advanced Editing)

---

### Pitfall 5.3: Chord Detection False Positives

**What breaks:**
- Single notes detected as chords (C → "Cmaj")
- Passing tones treated as chord tones (chromatic notes → wrong chord)
- Chord symbols obscure note view (visual clutter)

**Warning signs:**
- Chord symbols on every beat (too many)
- Incorrect chord labels
- User disables feature immediately

**Prevention:**
- Minimum 3 notes required for chord detection
- Filter passing tones (short duration notes ignored)
- Display chords only on downbeats (beat 1 per bar)
- Toggle button to hide chord overlay

**Example:**
```typescript
function detectChord(notes: Note[]): string | null {
  if (notes.length < 3) return null // Too few notes

  const sustainedNotes = notes.filter(n => n.durationTicks > 240) // Filter short notes
  const pitches = sustainedNotes.map(n => n.midi)

  return Chord.detect(pitches)[0] || null
}
```

**Phase assignment:** Phase 4 (Advanced Editing)

---

## 6. MIDI Hardware Pitfalls

### Pitfall 6.1: Browser Permission Blocking

**What breaks:**
- `navigator.requestMIDIAccess()` throws error (permission denied)
- User clicks "Block" → feature permanently broken
- No clear path to re-enable MIDI access

**Warning signs:**
- Feature works on dev machine, fails for users
- Safari users can't use MIDI (not supported)
- Firefox users need to enable flag manually

**Prevention:**
- Feature detection: `if (!navigator.requestMIDIAccess)`
- Clear error messages ("Your browser doesn't support MIDI. Try Chrome.")
- Graceful degradation (hide MIDI features if unavailable)
- Permission prompt only when user clicks "Connect MIDI" (not on page load)

**Example:**
```typescript
if (!navigator.requestMIDIAccess) {
  return <div>MIDI hardware requires Chrome, Edge, or Opera.</div>
}

// Request access only when user initiates
<button onClick={async () => {
  try {
    const access = await navigator.requestMIDIAccess()
    // ... success
  } catch (err) {
    alert('MIDI access denied. Check browser settings.')
  }
}}>
  Connect MIDI Keyboard
</button>
```

**Phase assignment:** Phase 5 (MIDI Hardware)

---

### Pitfall 6.2: Recording Timing Drift

**What breaks:**
- Notes recorded slightly off-beat (latency compensation wrong)
- Playback position updates 50ms late → notes 50ms early
- Long recordings accumulate drift (1 second off by end)

**Warning signs:**
- Recorded notes don't align with grid
- User has to manually quantize every recording
- Drift increases over time

**Prevention:**
- Compensate for Web MIDI latency (measure round-trip time)
- Use high-resolution timestamps (`performance.now()`)
- Record note-on time, calculate ticks from playback position
- Test with metronome (click tracks must align)

**Example:**
```typescript
const MIDI_LATENCY_MS = 15 // Measured latency

input.onmidimessage = (message) => {
  const timestamp = message.timeStamp - MIDI_LATENCY_MS
  const ticks = playbackStore.timestampToTicks(timestamp)
  recordNote({ midi: message.data[1], ticks, velocity: message.data[2] })
}
```

**Phase assignment:** Phase 5 (MIDI Hardware)

---

### Pitfall 6.3: Sustain Pedal Note Off Missing

**What breaks:**
- User presses sustain pedal → notes don't release
- Note-off events suppressed while pedal down
- Release pedal → all notes cut off abruptly (not natural decay)

**Warning signs:**
- Notes hang forever when sustain pedal used
- Sudden silence when releasing pedal
- Polyphony limit hit (too many sustained notes)

**Prevention:**
- Track pedal state (CC 64 value > 64 = pedal down)
- Queue note-off events while pedal down
- Release queued notes gradually when pedal lifts
- Implement proper pedal sustain in audio engine

**Example:**
```typescript
let sustainPedalDown = false
const pendingNoteOffs = []

input.onmidimessage = (msg) => {
  const [command, data1, data2] = msg.data

  if (command === 176 && data1 === 64) { // CC 64 (sustain)
    sustainPedalDown = data2 > 64

    if (!sustainPedalDown) {
      // Release all pending notes
      pendingNoteOffs.forEach(note => releaseNote(note))
      pendingNoteOffs.length = 0
    }
  }

  if (command === 128) { // Note off
    if (sustainPedalDown) {
      pendingNoteOffs.push(data1) // Queue for later
    } else {
      releaseNote(data1)
    }
  }
}
```

**Phase assignment:** Phase 5 (MIDI Hardware)

---

## Pitfall Summary Table

| Pitfall | Severity | Phase | Detection | Prevention |
|---------|----------|-------|-----------|------------|
| Layout shift breaking components | High | 1 | Visual regression | Test all components after layout change |
| Panel width state conflicts | Medium | 1 | Width resets on refresh | Use library's persistence only |
| Timeline scrubber performance | High | 1 | Audio glitches during drag | Throttle updates, RAF for visuals |
| Inline editing keyboard trap | Medium | 1 | Shortcuts fire while editing | stopPropagation on input |
| Breaking existing MIDI playback | Critical | 2 | MIDI sounds worse | A/B test with v1.0 files |
| Tone.js filter memory leaks | High | 2 | Memory grows over time | Reuse filters, dispose properly |
| Vibrato tuning issues | Medium | 2 | Notes sound out of tune | Subtle depth, disable for drums |
| ValidationPipeline bypass | Critical | 3 | Invalid MIDI generated | Always validate AI output |
| Token cost explosion | High | 3 | Bills > $5 per generation | Limit conversation, show cost estimate |
| GPT schema drift | Medium | 3 | JSON parsing errors | Use strict JSON schema mode |
| Question loop infinity | Medium | 3 | More than 3 questions | Hard limit, skip button |
| Random variation genre break | High | 3 | Wrong genre patterns | Strict scoping, validation |
| Seeded randomness not reproducible | Low | 3 | Can't regenerate | Store seed in metadata |
| Velocity lane desync | Medium | 4 | Visual mismatch | Shared state, sync scroll |
| Quantization destroying nuance | Medium | 4 | Sounds robotic | Default 80%, exclude threshold |
| Chord detection false positives | Low | 4 | Too many/wrong chords | Min 3 notes, filter passing tones |
| Browser permission blocking | High | 5 | MIDI fails in Safari/Firefox | Feature detection, clear errors |
| Recording timing drift | High | 5 | Notes off-beat | Latency compensation, high-res timestamps |
| Sustain pedal note off missing | Medium | 5 | Notes hang | Track pedal state, queue note-offs |

---

## Testing Checklist

**Phase 1 (UI Redesign):**
- [ ] All v1.0 components render correctly in new layout
- [ ] Panel width persists across refresh
- [ ] Timeline drag doesn't cause audio glitches
- [ ] Inline editing doesn't trigger keyboard shortcuts

**Phase 2 (Audio Quality):**
- [ ] All v1.0 MIDI files tested (no regressions)
- [ ] Memory usage stable during long playback (10+ minutes)
- [ ] Vibrato doesn't break scale validation

**Phase 3 (Generation):**
- [ ] AI-generated MIDI passes ValidationPipeline
- [ ] Token cost displayed before generation
- [ ] Question loop stops after 3 questions
- [ ] Template variations maintain genre consistency

**Phase 4 (Editing):**
- [ ] Velocity lane syncs with piano roll selection
- [ ] Quantization with 80% strength sounds natural
- [ ] Chord symbols only on sustained chords (3+ notes)

**Phase 5 (MIDI):**
- [ ] Graceful degradation in Safari (MIDI unsupported)
- [ ] Recorded notes align with metronome clicks
- [ ] Sustain pedal releases notes properly

---

## Rollback Plan

If critical bugs discovered post-deployment:

1. **UI issues:** Revert layout, restore vertical stack (1-hour rollback)
2. **Audio issues:** Revert to v1.0 instrument configs (feature flag flip)
3. **AI issues:** Disable AI mode, force template mode (feature flag)
4. **MIDI issues:** Hide MIDI features (feature detection)

All features should have feature flags for instant disable without code deploy.
