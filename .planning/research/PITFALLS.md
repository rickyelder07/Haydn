# Pitfalls Research: MIDI Editing & Music Production Web Applications

**Domain:** MIDI editing and music production web applications (AI-powered natural language editing)
**Researched:** 2026-01-23
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: LLM Musical Context Blindness

**What goes wrong:**
LLMs generate MIDI that is syntactically valid but musically nonsensical. Notes follow no harmonic logic, rhythms ignore genre conventions, and edits break musical context. The output sounds like "algorithmic slop" - random notes that happen to be in the right file format.

**Why it happens:**
- LLMs lack inherent understanding of music theory - they pattern-match text but don't "hear" the result
- GPT-4 makes documented music theory mistakes: interpreting ABC notation incorrectly (treating "4" as interval instead of duration), generating only I-IV-V-I progressions for chord requests, creating unintentional dissonances (E over G chord creating G6)
- Token optimization pressures lead to stripped context: removing key signature, tempo, previous measures, genre information
- Training data contains poor-quality MIDI alongside professional examples, with no way to distinguish

**How to avoid:**
1. **Never send raw MIDI tokens to LLM** - Use structured intermediate representation (JSON with musical semantics: key, scale degree, chord function, rhythmic position)
2. **Always provide musical context in prompt**:
   - Key signature and scale
   - Current chord progression
   - Genre conventions (jazz voice leading vs EDM quantization)
   - Surrounding measures for phrase structure
3. **Implement music theory validation layer** - After LLM generates edits, validate against:
   - Scale/key conformance
   - Voice leading rules (if relevant to genre)
   - Rhythmic quantization appropriate to genre
   - Harmonic function (chord tones vs passing tones)
4. **Use constrained generation** - Provide LLM with valid note choices per beat: "At beat 3, valid notes are [C, E, G] (C major chord tones)"

**Warning signs:**
- User reports edits "sound random" or "don't fit the song"
- Generated notes frequently outside the key
- Rhythm changes ignore time signature or genre (e.g., swing 16ths in house music)
- Velocity values are uniform (no dynamics) or nonsensical (alternating 1 and 127)

**Phase to address:**
Phase 1-2 (MVP foundation) - Musical quality is the core differentiator. Build validation layer before adding features.

---

### Pitfall 2: Token Budget Explosion

**What goes wrong:**
MIDI files are verbose when tokenized. A 4-bar phrase can consume thousands of tokens. Sending full context + edit request + response exhausts LLM context window or incurs massive API costs. Teams either:
- Strip context to save tokens (see Pitfall 1 - loses musical quality)
- Send minimal MIDI (single track, no dynamics, no CC data)
- Burn through budget with $50+ costs per edit

**Why it happens:**
- Standard MIDI tokenization (AMT, REMI, etc.) uses 3-4 tokens per note event: [time, pitch, velocity, duration]
- High-resolution timing (10ms quantization) multiplies token count
- Multi-track MIDI with CC data (mod wheel, expression, pitch bend) adds exponential complexity
- Context requirements compound: need surrounding measures + metadata + instruction + output space

**How to avoid:**
1. **Hierarchical tokenization strategy**:
   - Send high-level structure (chord progression, form) as compact JSON
   - Only send detailed note-level data for the specific region being edited
   - Use musical abbreviations: "Cmaj7" instead of tokenized [C4, E4, G4, B4]
2. **Compression techniques from MIDI-LLM research**:
   - 10ms quantization for timing (not 1ms) - 10x reduction with imperceptible quality loss
   - Note duration quantization to common values (whole, half, quarter, eighth, 16th)
   - Velocity quantization to 8 levels (not 128) - pppp/ppp/pp/p/mp/mf/f/ff/fff
   - Instrument-level grouping (one token for instrument, not per note)
3. **Smart context windowing**:
   - 2 bars before + 2 bars after edit region (not entire song)
   - Key/tempo metadata only (not redundant per-note timing)
   - Summarize distant context: "Verse 1 (8 bars, C major, 120 BPM)" vs full token stream
4. **Iterative editing with state**:
   - Cache song context between edits (don't re-send each time)
   - Send only deltas/changes in subsequent requests

**Warning signs:**
- API costs scale linearly with song length (should be constant per edit)
- Context window errors appearing for songs >1 minute
- Need to strip CC data or collapse to mono to fit in token budget
- Edit quality degrades for longer songs (context stripped)

**Phase to address:**
Phase 1 (before public launch) - Cost model determines business viability. Prototype tokenization strategy early.

---

### Pitfall 3: Browser Audio Clock Desynchronization

**What goes wrong:**
MIDI playback timing is sloppy. Notes drift out of sync with the beat, especially after a few minutes. Audio tracks and MIDI tracks diverge. Timing is inconsistent across browser tabs or after tab becomes inactive. Users perceive as "buggy" and "unprofessional."

**Why it happens:**
- **Two incompatible clocks**: Web Audio API uses `AudioContext.currentTime` (high precision, audio thread), but JavaScript timing uses `setTimeout/setInterval` (low precision, main thread, affected by tab throttling)
- **setTimeout unreliable for music**: Can be delayed by garbage collection, heavy renders, browser tab throttling (background tabs throttled to 1000ms minimum)
- **Timer precision reduction**: Firefox's `privacy.reduceTimerPrecision` (default 2ms) and Spectre/Meltdown mitigations clamp high-resolution timers to milliseconds
- **Main thread blocking**: Visual updates, React re-renders, file parsing on main thread can delay audio events by 10-100ms

**How to avoid:**
1. **Never use setTimeout for note scheduling** - Only use Web Audio API's internal clock
2. **Implement "A Tale of Two Clocks" pattern**:
   - JavaScript timer (setTimeout) fires every 100ms to *schedule* future notes
   - Notes scheduled 100-200ms in advance using `audioContext.currentTime + offset`
   - Web Audio API handles precise timing on audio thread
3. **Schedule in batches**: Don't schedule one note at a time; schedule next 1-2 seconds of notes per timer tick
4. **Account for timer drift**: Check `audioContext.currentTime` on each timer tick and adjust scheduling offset
5. **Use Web Workers for MIDI parsing/processing** - Keep main thread free for timing-critical tasks

**Warning signs:**
- Metronome click drifts from visual beat indicator
- Timing worse when browser tab in background
- Timing degrades after playback runs for >2 minutes
- Faster tempos (>140 BPM) have more timing variance than slower tempos

**Phase to address:**
Phase 1 (playback foundation) - Timing precision is table stakes. Users will notice immediately.

**Sources:**
- [A Tale of Two Clocks - Web Audio Scheduling](https://web.dev/audio-scheduling/)
- [Understanding The Web Audio Clock](https://sonoport.github.io/web-audio-clock.html)
- [MDN: BaseAudioContext.currentTime](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime)

---

### Pitfall 4: MIDI File Format Compatibility Hell

**What goes wrong:**
User imports MIDI file, and tempo is wrong (stuck at 120 BPM), time signature ignored (always 4/4), tracks merged unexpectedly, or file rejected entirely. User exports MIDI from your app, and their DAW can't open it or loses instrument data. Cross-DAW workflow breaks.

**Why it happens:**
- **SMF Format 0 vs Format 1**: Type 0 (single track, all events merged) vs Type 1 (multi-track with separate parts). Converting 0→1 is lossy (can't recover which hand/instrument played what). Some hardware only accepts Format 0.
- **Tempo/time signature location**: Spec says tempo SHOULD be in first track (not MUST). Many files scatter these events across tracks. Some parsers only check track 0.
- **Track chunk size is wrong 50% of the time**: Per research, implementations should ignore the size field and parse until end-of-track marker
- **Running status**: MIDI files use running status (omit repeated status bytes). If parser expects status byte but gets data byte, must re-use previous status.
- **SysEx events**: F0 events use variable-length quantity for size. Must read length field, not scan for F7 terminator.
- **File extension issues**: .mid vs .smf - Windows requires extension, Mac doesn't. Cross-platform transfers fail.

**How to avoid:**
1. **Use battle-tested parser**: Don't write MIDI parser from scratch. Use tonejs/midi, midifile.js, or equivalent with test coverage.
2. **Support both SMF 0 and SMF 1 on import**: Normalize to internal format immediately
3. **Scan all tracks for tempo/time signature on import** - Don't assume track 0. Consolidate to single tempo map.
4. **Export as SMF 1 by default** - Better compatibility with DAWs. Offer SMF 0 as option for hardware compatibility.
5. **Validate exports**: Round-trip test (export → re-import) to catch serialization bugs
6. **Handle running status correctly**: Track last status byte; if next byte is data (0x00-0x7F), reuse status
7. **Test with malformed files**: Use Shkyrockett/midi-unit-test-cases repo for edge cases

**Warning signs:**
- User imports file, reports "tempo is stuck at 120" (tempo events not in track 0)
- Multi-track import merges all instruments to one track (only reading track 0)
- Export from your app can't be opened in Ableton/Logic/FL Studio
- Files with SysEx data crash the parser

**Phase to address:**
Phase 1 (file I/O) - Import/export is the entry and exit point. Broken imports = DOA product.

**Sources:**
- [Understanding MIDI Files - Ableton](https://help.ableton.com/hc/en-us/articles/209068169-Understanding-MIDI-files)
- [Tempo Map and MIDI Files of Format 1 - MIDI.org](https://midi.org/community/midi-specifications/tempo-map-and-midi-files-of-format-1)
- [MIDI File Parsing Homework - CCARH Wiki](https://wiki.ccarh.org/wiki/MIDI_file_parsing_homework)

---

### Pitfall 5: Quantization Destroys Musical Feel

**What goes wrong:**
Users edit MIDI with natural language ("make the drums tighter"), LLM quantizes to grid, and the result sounds robotic, lifeless, and worse than the input. Groove is destroyed. Swing feel flattened. Human performances become mechanical.

**Why it happens:**
- **Over-quantization**: Moving every note exactly to grid removes micro-timing that creates groove
- **LLM lacks nuance**: Prompt says "tighter timing" → LLM interprets as "100% quantization" rather than "60% quantization"
- **Genre-blindness**: Jazz/funk/hip-hop intentionally use off-grid timing (swing, shuffle, laid-back). Quantizing these destroys the style.
- **Velocity flattening**: LLMs often normalize velocity (all notes at same level) when editing, removing dynamics

**How to avoid:**
1. **Never quantize at 100% strength** - Default to 50-70% quantization (move notes partway toward grid)
2. **Genre-aware quantization**:
   - EDM/Pop: 80-90% quantization acceptable
   - Rock/Indie: 50-70% quantization
   - Jazz/Blues: 30-50% quantization (preserve swing)
   - Hip-hop: Quantize kicks/snares, leave hi-hats loose
3. **Preserve swing/groove templates**: If input has swing, maintain swing ratio after edits
4. **Velocity humanization**: When generating/editing notes, vary velocity 10-20% around target value
5. **Prompt engineering for musical context**:
   - BAD: "Quantize the drums"
   - GOOD: "Tighten drum timing slightly (60% quantization) while preserving the groove"
6. **Provide quantization preview**: Let user hear before/after, adjust strength

**Warning signs:**
- Users describe edits as "robotic" or "lifeless"
- All drum hits have identical velocity
- Swing rhythm becomes straight 8ths after edit
- Hi-hats lose shuffle feel

**Phase to address:**
Phase 2 (musical refinement) - After basic editing works, focus on quality and feel.

**Sources:**
- [5 MIDI Quantization Tips - MIDI.org](https://midi.org/5-midi-quantization-tips)
- [Quantization in Music - LANDR Blog](https://blog.landr.com/quantization-in-music/)

---

### Pitfall 6: Safari/iOS Lockout (No Web MIDI API)

**What goes wrong:**
40%+ of users (Safari desktop + all iOS browsers) cannot use core MIDI features. They can't import MIDI files, can't connect MIDI controllers, can't export to DAW. Product is unusable for huge user segment.

**Why it happens:**
- Safari deliberately does not support Web MIDI API (desktop or iOS) due to fingerprinting concerns (announced 2020, still true in 2026)
- Firefox added support only in version 109 (late 2023) - older Firefox users also locked out
- iOS browsers (Chrome iOS, Firefox iOS) are forced to use WebKit engine, inheriting Safari's limitations
- Web MIDI compatibility score: 63/100 (moderate, not universal)

**How to avoid:**
1. **Detect and fallback gracefully**:
   ```javascript
   if (!navigator.requestMIDIAccess) {
     // Safari detected - use file-based workflow only
     showFilePicker(); // Accept .mid file upload
   }
   ```
2. **File-based workflow as primary**: Don't require Web MIDI API for core features
   - Import: Accept .mid file upload (File API, universal)
   - Export: Download .mid file (Blob API, universal)
   - Editing: Works entirely client-side (no MIDI I/O needed)
3. **MIDI controller support as optional enhancement**: Nice-to-have for Chrome/Firefox users, not required for Safari users
4. **Consider polyfills for server-side MIDI processing**: Parse .mid file server-side if client can't (limited by latency, not ideal for real-time)
5. **Clear user communication**: If MIDI controller feature detected as unavailable, show: "MIDI controller support requires Chrome or Firefox. File import/export works in all browsers."

**Warning signs:**
- Safari users report "MIDI import doesn't work"
- iOS users can't use app at all
- Feature detection missing - app assumes Web MIDI API always available

**Phase to address:**
Phase 1 (architecture) - Core decision: Build file-based (universal) or Web MIDI-dependent (Chrome/Firefox only)?

**Sources:**
- [Web MIDI API Browser Compatibility - Can I Use](https://caniuse.com/midi)
- [Web MIDI Browser Compatibility - LambdaTest](https://www.lambdatest.com/web-technologies/midi)
- [Web MIDI Permission Requirements - Chrome Developers Blog](https://developer.chrome.com/blog/web-midi-permission-prompt)

---

### Pitfall 7: AI-Generated "Slop" Artifacts

**What goes wrong:**
LLM generates MIDI that passes validation checks but still sounds obviously AI-generated. Users describe it as "generic," "formulaic," "lacks soul," or "sounds like Muzak." The output is technically correct but musically boring and indistinguishable from mass-produced AI slop flooding streaming platforms.

**Why it happens:**
- **Training data contains slop**: LLMs trained on mixture of professional music and low-quality MIDI from internet. Model learns cliches, not creativity.
- **Statistical averaging**: LLMs generate "most likely next token" which produces middle-of-the-road, safe, bland output
- **Lack of musical intent**: Professional music has intentional tension/release, surprise, emotional arc. LLM generates pattern-matching without intent.
- **Spectral artifacts**: AI music generation research identified systematic frequency artifacts in deconvolution modules (small distinctive spectral peaks)
- **Generic instrumentation**: LLM defaults to GM (General MIDI) instrument set, which sounds dated (1991 standard)

**How to avoid:**
1. **Constrain LLM to editing, not generation**: Your product is for editing existing MIDI (user-created or imported). Don't market as "AI generates full songs" (that's the slop market).
2. **Preserve user's original notes/style**: When editing, maintain:
   - Original velocity curve patterns
   - Instrument choices
   - Rhythmic complexity (don't simplify)
   - Harmonic sophistication (don't dumb down to I-IV-V)
3. **Inject musical sophistication via prompt engineering**:
   - Provide genre-specific rules: "In jazz, use chord extensions (9ths, 11ths, 13ths)"
   - Encourage variation: "Vary velocity 20-40 points for dynamics"
   - Reference specific styles: "Voicing like Bill Evans" not generic "jazz"
4. **Human-in-the-loop refinement**: After LLM edit, provide UI for user to adjust:
   - Velocity curve editor
   - Timing micro-adjustments
   - Note selection tweaks
5. **Quality filters**:
   - Detect repetitive patterns (same 2-bar phrase 4x in a row)
   - Flag overly simple chord progressions
   - Warn if velocity range is too narrow (<20 points)

**Warning signs:**
- User feedback mentions "generic" or "sounds like AI"
- Generated sections lack dynamics (flat velocity)
- Chord progressions are always I-IV-V-I or I-V-vi-IV
- Melodies use only scale tones (no chromatic passing tones)
- Every 8-bar phrase is identical

**Phase to address:**
Phase 2-3 (quality refinement) - After MVP, focus on differentiation through quality.

**Sources:**
- [AI Slop and Musical Creativity - Ethan Hein Blog](https://www.ethanhein.com/wp/2025/ai-slop-and-musical-creativity/)
- [AI Music Slop Problem on Spotify - Music Business Worldwide](https://www.musicbusinessworldwide.com/the-ai-music-problem-on-spotify-and-other-streaming-platforms-is-worse-than-you-think/)
- [A Fourier Explanation of AI-music Artifacts - arXiv](https://arxiv.org/html/2506.19108v1)
- [ChatGPT Gets Music Theory Wrong - OpenAI Community](https://community.openai.com/t/chatgpt-gets-music-theory-wrong/256481)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Send raw MIDI bytes to LLM (not structured JSON) | Simpler implementation, no parsing layer | Musical nonsense output, impossible to debug, high token cost | Never - structured format is foundation |
| Use setTimeout for MIDI playback scheduling | Easy to implement, familiar API | Sloppy timing, drift, unusable for serious music | Only for prototype/proof-of-concept |
| Only support SMF Format 0 export | Simpler exporter code (single track) | DAW import loses instrument separation, users can't edit by track | Never - Format 1 is standard |
| Skip tempo map handling, assume 120 BPM | 80% of files work fine | 20% of imports have wrong timing, user sees as broken | Only if showing "not all features supported" warning |
| Store MIDI as text in database (JSON stringified) | Easy to query/debug, human-readable | Massive storage bloat, slow parsing, version drift | MVP only (plan migration path) |
| Quantize everything to 16th notes (no 32nds/triplets) | Simpler grid, smaller token count | Cannot represent fast runs, swing, or complex rhythms | Never for production - limits musical range |
| Ignore MIDI CC data (mod wheel, expression, sustain) | 90% smaller token budget | No dynamics, no expression, sounds like 1985 MIDI | MVP acceptable if focused on note editing only |
| Client-side only (no backend LLM calls) | Free, fast, works offline | Limited to small models (not GPT-4), lower quality | Only if token budget allows full context in prompt |
| Collapse multi-track to mono for LLM processing | 5-10x token reduction | Loses instrument context, edits don't respect arrangement | Never - use hierarchical context instead |
| Use deprecated GM (General MIDI) soundfonts | Free, easy, 16MB download | Sounds dated/unprofessional compared to modern VSTs | MVP acceptable with plan to upgrade |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI API (GPT-4o) | Sending full MIDI file as text (10k+ tokens per request) | Send structured JSON with only edited region + minimal context (key, tempo, 2 bars before/after) |
| OpenAI API (GPT-4o) | Not handling rate limits (429 errors) | Implement exponential backoff, queue requests, show user "processing" state |
| Web MIDI API | Calling `navigator.requestMIDIAccess()` without user gesture | Requires user interaction (button click). Prompt user to enable before accessing. |
| Web Audio API | Creating new `AudioContext` per playback | AudioContext limit is ~6 per page. Reuse single global context, resume on user interaction. |
| File Upload (MIDI) | Loading entire file into memory at once | Stream large files, parse incrementally if >10MB |
| DAW Export | Assuming your MIDI format matches target DAW | Test exports with Ableton, Logic, FL Studio, Reaper. Each has quirks. |
| Browser Storage (IndexedDB) | Storing parsed MIDI objects directly | IndexedDB has structured clone limitations. Serialize to JSON or binary first. |
| Tone.js Transport | Syncing external audio files with MIDI playback | Tone.Transport.start() requires timestamp argument. Calculate offset from audioContext.currentTime |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Parsing MIDI on every playback | Playback start delay increases with file size | Parse once on import, cache parsed structure in memory/IndexedDB | Files >500 KB (~2-3 min songs) |
| Re-rendering entire piano roll on every note change | UI freezes for >1 sec after edits | Virtual scrolling, only render visible notes, use canvas/WebGL for >1000 notes | Songs with >5000 notes |
| Sending entire song to LLM for each edit | API costs scale with song length, slow response | Send only edited region + 2-bar context window | Songs >1 minute |
| Loading all samples into memory at startup | 2+ second load time, mobile users run out of RAM | Lazy-load samples for instruments actually used in song | >50 instrument samples loaded |
| Naive MIDI event sorting (bubble sort, etc.) | Import time increases exponentially | Use merge sort or browser's native sort (TimSort) | Files with >10k events |
| Storing edit history in JavaScript array (for undo) | Memory leak, grows unbounded | Limit to last 50 edits, serialize old edits to IndexedDB | After 100+ edits |
| Synchronous file I/O blocking UI thread | Browser "page unresponsive" warning | Use Web Workers for MIDI parsing, async file reading | Files >1 MB |
| Audio buffer size too small (64 samples) | Clicks/pops, CPU spikes, audio dropouts | Use 256-512 sample buffers for web (not DAW-style 64) | Older devices, background tabs |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Executing user-provided MIDI SysEx messages | Malicious SysEx can brick hardware synthesizers | Strip SysEx on import unless explicitly allowed, warn user before sending |
| No file size limits on MIDI upload | DoS attack via 100MB malformed MIDI file | Limit uploads to 5 MB max (generous for MIDI), validate chunk sizes |
| Sending user's MIDI to LLM without consent | Privacy violation - MIDI can contain original compositions | Clear ToS: "Your MIDI is sent to OpenAI for processing." Offer local-only mode. |
| Storing API keys in client-side JavaScript | Exposed in browser, users can steal and abuse | Use backend proxy for LLM calls, never expose keys to client |
| No rate limiting on LLM edit requests | User can spam API, rack up $1000s in costs | Implement per-user rate limits, daily spend caps, require auth |
| Loading MIDI from arbitrary URLs (CORS bypass) | SSRF attack, can probe internal network | Only allow file upload or whitelisted domains |
| Deserializing MIDI without validation | Malformed files can crash parser, exploit vulnerabilities | Validate header magic bytes (MThd), chunk sizes, data ranges before parsing |
| Allowing infinite loop playback with overlapping requests | Memory leak, browser tab crash | Limit concurrent playback instances, cancel previous when starting new |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback during LLM processing (15-30s wait) | User thinks app is frozen, clicks repeatedly | Show "Editing..." progress indicator, estimated time remaining |
| Playback starts immediately on import (no preview) | Unexpected loud audio, startles user, hearing damage risk | Require user to click "Play," default volume to 70%, show waveform preview |
| Piano roll scrolls to top after each edit | User loses place, must scroll back to edited region | Maintain scroll position or auto-scroll to edited region |
| Undo only works for LLM edits, not manual edits | Inconsistent behavior, user confusion | Unified undo stack for all edit types (LLM + manual) |
| No "before/after" comparison for LLM edits | User can't tell what changed, hard to evaluate quality | Split view: original vs edited, highlight changed notes |
| MIDI export with no filename suggestion | User sees "download.mid" (unhelpful) | Suggest filename from original import or project name: "MySong_edited.mid" |
| Generic error messages ("MIDI parsing failed") | User doesn't know how to fix, file seems corrupted | Specific errors: "File is Format 2 (not supported). Try exporting as Format 0 or 1 from your DAW." |
| Piano roll shows MIDI note numbers (60, 64, 67) | Confusing for musicians who think in note names | Display note names (C4, E4, G4) with optional MIDI number overlay |
| No metronome/click track during playback | Hard to evaluate timing accuracy | Built-in click track (toggle on/off), visual beat indicators |
| Can't preview sound before editing (just piano roll) | User edits blindly, must export to hear | Built-in synthesizer for playback, or audio file import alongside MIDI |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **MIDI Import:** File parses without errors — verify tempo map extraction, time signature changes, all tracks (not just track 0), running status handling, SysEx data stripped safely
- [ ] **Playback Timing:** Sounds correct at 120 BPM — verify swing timing, tempo changes mid-song, timing after 3+ minutes, background tab throttling, works at 180 BPM and 60 BPM
- [ ] **LLM Editing:** Generates valid MIDI — verify musical quality (key conformance, genre conventions, dynamics variation), token count stays under budget for 3-minute songs
- [ ] **Multi-track Support:** Imports 8-track file — verify edits don't bleed across tracks, export preserves track separation, instruments remain assigned correctly
- [ ] **MIDI Export:** DAW can open the file — verify tempo map export, time signature export, track names preserved, round-trip import/export works (no data loss)
- [ ] **Web MIDI API:** Controller sends notes — verify permission prompt works, device hot-plug detection, Safari fallback (file-based workflow), release device on page unload
- [ ] **Undo/Redo:** Can undo last edit — verify undo stack doesn't leak memory, works after 50+ edits, persists across page refresh (if sessions saved), redo works after undo
- [ ] **Audio Playback:** Hear notes when playing — verify no clicks/pops at 256 sample buffer, works in background tab, resume after tab sleep, multiple simultaneous notes, velocity affects volume
- [ ] **File Upload:** Accepts .mid files — verify .smf extension also works, shows error for .wav or other audio formats, handles 5 MB files without freezing, progress indicator for large files

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| LLM generates musically bad edit | LOW | 1. Show "Revert to Original" button prominently<br>2. Offer "Try Again with Different Prompt" option<br>3. Let user manually adjust notes in piano roll<br>4. Learn from feedback: "Was this edit helpful?" |
| Token budget exceeded, can't process song | MEDIUM | 1. Implement chunked processing: edit 8 bars at a time<br>2. Offer "Reduce Token Usage" mode (strip CC data, reduce timing precision)<br>3. Cache song structure, only send deltas<br>4. Upgrade to model with larger context (GPT-4 Turbo 128K) |
| Playback timing is sloppy/drifting | HIGH | 1. Rewrite playback engine using Web Audio scheduling<br>2. Move MIDI parsing to Web Worker<br>3. Implement lookahead scheduling (100-200ms)<br>4. Test extensively across browsers<br>5. May require 1-2 week refactor |
| Safari users can't use app (Web MIDI dependent) | HIGH | 1. Build file-based import/export workflow<br>2. Make Web MIDI controller support optional<br>3. Detect browser capabilities, show appropriate UI<br>4. Communicate clearly: "Full features in Chrome/Firefox"<br>5. Requires architecture change if Web MIDI was core dependency |
| Imported MIDI has wrong tempo (stuck at 120) | MEDIUM | 1. Add "Detect Tempo from All Tracks" feature<br>2. Scan all tracks, not just track 0<br>3. Let user manually override tempo after import<br>4. Show warning: "Detected multiple tempo values, using [X]" |
| Export doesn't open in user's DAW | MEDIUM | 1. Offer both SMF Format 0 and Format 1 export options<br>2. Add "Export for [DAW]" presets (Ableton, Logic, FL Studio)<br>3. Validate exported file before download (round-trip parse)<br>4. Provide troubleshooting guide for common import errors |
| Over-quantization destroyed groove | LOW | 1. Implement "Undo Last Edit"<br>2. Add "Quantize Strength" slider (default 50%, not 100%)<br>3. Show before/after preview<br>4. Let user adjust after the fact in UI |
| AI-generated output sounds like "slop" | MEDIUM | 1. Add quality filters (detect repetition, flat velocity)<br>2. Improve prompt engineering with genre-specific rules<br>3. Let user refine in piano roll editor<br>4. Consider hybrid: LLM suggests edits, user approves before applying<br>5. Differentiate via editing (not generation) features |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| LLM Musical Context Blindness | Phase 1-2: Build structured JSON intermediate format, music theory validation layer | User tests: "Does edited MIDI sound musical?" Genre-specific test cases. |
| Token Budget Explosion | Phase 1: Design tokenization strategy with budget modeling | Calculate tokens for 1-min, 3-min, 5-min songs. Target <2000 tokens/edit. |
| Browser Audio Clock Desync | Phase 1: Implement Web Audio scheduling with lookahead pattern | Test: Metronome stays in sync for 5+ minutes. Works in background tab. |
| MIDI Format Compatibility Hell | Phase 1: Choose battle-tested parser, test with edge case files | Round-trip tests with malformed files. Import from 5+ DAWs. |
| Quantization Destroys Feel | Phase 2: Implement genre-aware quantization, strength controls | A/B test: Users prefer 60% quantized vs 100% quantized output. |
| Safari/iOS Lockout | Phase 1: Architecture decision - file-based or Web MIDI dependent | Test app on Safari, verify file import/export works without Web MIDI API. |
| AI-Generated Slop | Phase 2-3: Quality filters, prompt engineering, human-in-loop refinement | Blind test: Can users distinguish your AI edits from human edits? |

---

## Sources

### Browser & Web API Limitations
- [Web MIDI API Browser Compatibility - Can I Use](https://caniuse.com/midi)
- [Cross Browser Compatibility Score of Web MIDI API - LambdaTest](https://www.lambdatest.com/web-technologies/midi)
- [Web MIDI API Permission Requirements - Chrome Developers Blog](https://developer.chrome.com/blog/web-midi-permission-prompt)
- [Web MIDI API Specification - W3C](https://www.w3.org/TR/webmidi/)
- [Web MIDI API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)

### Audio Timing & Scheduling
- [A Tale of Two Clocks - Web Audio Scheduling](https://web.dev/audio-scheduling/)
- [Understanding The Web Audio Clock](https://sonoport.github.io/web-audio-clock.html)
- [BaseAudioContext: currentTime property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime)
- [Web Audio API Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

### MIDI File Format Issues
- [Understanding MIDI Files - Ableton](https://help.ableton.com/hc/en-us/articles/209068169-Understanding-MIDI-files)
- [Tempo Map and MIDI Files of Format 1 - MIDI.org](https://midi.org/community/midi-specifications/tempo-map-and-midi-files-of-format-1)
- [MIDI File Parsing Homework - CCARH Wiki](https://wiki.ccarh.org/wiki/MIDI_file_parsing_homework)
- [SMF Format Definition - MD_MIDIFile](https://majicdesigns.github.io/MD_MIDIFile/page_smf_definition.html)
- [Problems with Tempo and Time Signatures - MuseScore Issue #10962](https://github.com/musescore/MuseScore/issues/10962)

### LLM & AI Music Quality
- [MIDI-LLM: Adapting LLMs for Text-to-MIDI Generation - arXiv](https://arxiv.org/abs/2511.03942)
- [ChatGPT Gets Music Theory Wrong - OpenAI Community](https://community.openai.com/t/chatgpt-gets-music-theory-wrong/256481)
- [Can LLMs "Reason" in Music? - arXiv](https://arxiv.org/html/2407.21531v1)
- [AI Slop and Musical Creativity - Ethan Hein Blog](https://www.ethanhein.com/wp/2025/ai-slop-and-musical-creativity/)
- [AI Music Slop Problem on Spotify - Music Business Worldwide](https://www.musicbusinessworldwide.com/the-ai-music-problem-on-spotify-and-other-streaming-platforms-is-worse-than-you-think/)
- [A Fourier Explanation of AI-music Artifacts - arXiv](https://arxiv.org/html/2506.19108v1)
- [Context Window Limits in LLMs 2026 - DataCamp](https://www.datacamp.com/blog/context-window)

### MIDI Quantization & Musical Feel
- [5 MIDI Quantization Tips - MIDI.org](https://midi.org/5-midi-quantization-tips)
- [Quantization in Music - LANDR Blog](https://blog.landr.com/quantization-in-music/)
- [Quantization (music) - Wikipedia](https://en.wikipedia.org/wiki/Quantization_(music))

### MIDI Velocity & Dynamics
- [The Quirks of MIDI Velocity - Melatonin](https://melatonin.dev/blog/doing-my-synthesizer-homework-the-quirks-of-midi-velocity/)
- [MIDI Programming: Velocity vs. Expression - Gearspace](https://gearspace.com/board/electronic-music-instruments-and-electronic-music-production/795519-midi-programming-velocity-vs-expression.html)
- [Understanding MIDI Velocity and Aftertouch - Home Studio Guys](https://homestudioguys.com/blog/understanding-midi-velocity-and-aftertouch/)

### Performance & Buffer Issues
- [Solving MIDI Timing Problems - Sound on Sound](https://www.soundonsound.com/techniques/solving-midi-timing-problems)
- [Audio Buffer Underruns - KVR Audio Forum](https://www.kvraudio.com/forum/viewtopic.php?t=447624)
- [How to Improve DAW Buffer Performance - DepartureMusic](https://www.departuremusic.com/improve-daw-buffer-performance-engineers/)

---

*Research completed: 2026-01-23*
*Confidence: MEDIUM-HIGH - Findings based on official documentation, recent research papers (MIDI-LLM 2025), community discussions, and known browser limitations. Lower confidence on LLM musical quality patterns (fewer authoritative sources, more anecdotal). Higher confidence on browser API limitations and MIDI format issues (well-documented, stable over time).*
