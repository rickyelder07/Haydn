# Project Research Summary

**Project:** Haydn - Natural Language MIDI Editor
**Domain:** Web-based MIDI editing with AI-powered natural language editing
**Researched:** 2026-01-23
**Confidence:** MEDIUM-HIGH

## Executive Summary

Haydn is a web-based MIDI editor that uses natural language to manipulate musical data, positioning itself as a focused editing tool rather than a full DAW. The recommended approach is a client-side MIDI processing architecture with a thin backend LLM orchestration layer. Core technologies include React + Vite for the frontend, @tonejs/midi for MIDI manipulation, Tone.js + smplr for audio playback, and a Node.js Express backend for GPT-4o integration. This stack prioritizes token efficiency (critical for LLM API costs) and client-side processing (privacy, offline capability, instant feedback).

The product's success hinges on solving a unique challenge: LLMs are musically blind - they can pattern-match text but lack inherent music theory understanding. This means the architecture must include a music theory validation layer that provides musical context in prompts (key signature, chord progressions, genre conventions) and validates LLM outputs against theory rules. Without this layer, edits will sound "algorithmically generated" - syntactically valid MIDI that is musically nonsensical.

Key risks are token budget explosion (MIDI is verbose), browser audio timing issues (requires Web Audio API scheduling patterns), MIDI file format compatibility (Format 0 vs 1, tempo map handling), and Safari/iOS limitations (no Web MIDI API support). Mitigation strategies are well-documented: hierarchical tokenization with minimal context windows, AudioWorklet-based playback with lookahead scheduling, battle-tested parsers like @tonejs/midi, and file-based workflows that work universally across browsers.

## Key Findings

### Recommended Stack

The stack is optimized for two critical constraints: token efficiency (minimize LLM API costs) and client-side processing (instant feedback, privacy). Research strongly recommends Vite over Next.js because Haydn is a client-side audio application with no SEO requirements - Vite provides faster development iteration and direct control over Web Audio API without SSR overhead.

**Core technologies:**
- **React 18 + TypeScript 5 + Vite 6**: Client-side framework with type safety for complex MIDI data structures - critical for preventing runtime errors with music theory logic
- **@tonejs/midi 2.x**: MIDI parsing and export - converts binary MIDI to JSON (5-10x more token-efficient), de facto standard in the Tone.js ecosystem
- **Tone.js 14.7.39**: Web Audio synthesis framework - required for MIDI playback with precise timing via Transport system
- **smplr 0.x**: Sample-based instrument playback - modern replacement for deprecated soundfont-player, high-quality samples hosted online (no server setup)
- **Node.js 20 LTS + Express 4.x**: Thin backend proxy for GPT-4o API calls - protects API keys and enables token optimization via structured output
- **OpenAI SDK 4.x**: Official SDK for GPT-4o integration with streaming, retries, and structured output mode (reduces token usage ~30%)

**Critical version notes:**
- smplr is pre-1.0 (API may change) but actively maintained and recommended by soundfont-player author
- Safari does NOT support Web MIDI API - file-based workflow (upload/download MIDI) works universally, hardware controller support is Chrome/Firefox only

### Expected Features

Research reveals a clear feature hierarchy for MIDI editors. Natural language editing is Haydn's core differentiator - no competitor has successfully integrated LLM-powered editing with music theory validation.

**Must have (table stakes):**
- Piano Roll Editor - universal MIDI editing interface, every tool has one
- MIDI Import/Export - users need to move files between DAWs (SMF Format 0/1 support)
- Basic Note Editing - add, delete, move, resize notes (manual fallback when NL fails)
- Audio Playback - validate edits by ear (SoundFont-based or Web Audio synthesis)
- Undo/Redo - essential safety net when AI makes bad suggestions
- Playback Controls - play, pause, stop, loop (standard transport)
- Tempo Control - set BPM for musical context

**Should have (competitive advantage):**
- Natural Language Editing - CORE DIFFERENTIATOR (revolutionary UX: "make this jazzy" vs manual tweaking)
- Music Theory Engine - intelligent validation ensuring edits are musically coherent (scale detection, chord analysis, voice leading)
- Multi-track Support (2-4 tracks) - enables "add bass line" prompts (defer to v1.x after single-track validation)
- Quantization - context-aware timing correction (preserve groove, don't robotize)
- Velocity Editing - dynamics control for expressive edits
- MIDI Hardware Input - record from keyboard via Web MIDI API (v1.x feature)

**Defer (v2+):**
- Real-Time Collaboration - high complexity, unclear demand for MIDI editing specifically
- Advanced CC Automation - professional feature, desktop DAW territory
- Notation View - composers value it but high complexity, doesn't enhance NL editing core
- Full DAW Feature Parity - scope creep, web platform limitations (VST plugins impossible in browser)

**Anti-features to avoid:**
- Unlimited track count - performance degrades in browser, cap at 8-16 tracks
- VST/AU plugin support - impossible in browser sandbox, focus on MIDI editing excellence and export to DAW for sound design
- Advanced audio recording - desktop DAW territory, stick to MIDI focus

### Architecture Approach

Standard pattern for web MIDI editors: client-side processing with backend LLM orchestration. All MIDI parsing, manipulation, and export happens in the browser (privacy, offline capability, instant feedback). Backend is a thin proxy for GPT-4o API calls with structured output to minimize token usage.

**Major components:**

1. **MIDI Parser (client-side)** - Parse MIDI/MusicXML to structured JSON using @tonejs/midi. Converts binary MIDI to human-readable format (5-10x more token-efficient for LLM integration). Handles SMF Format 0/1, tempo maps, time signatures, running status.

2. **LLM Integration Service (backend)** - Node.js Express API routes that construct GPT-4o prompts with minimal musical context (key, tempo, track structure - NOT full note arrays), use structured output mode with JSON schema validation (30% token reduction), and stream responses back to frontend. Implements sliding window context management for conversational mode (keep last 10 messages to prevent token overflow).

3. **Music Theory Validation Layer (client-side)** - Critical component that LLMs lack inherently. Provides musical context in prompts (key signature, chord progressions, genre conventions), validates LLM outputs against theory rules (scale conformance, voice leading, rhythmic quantization), and implements constrained generation (provide LLM with valid note choices per beat).

4. **Audio Engine (client-side AudioWorklet)** - Web Audio API playback using AudioWorklet (runs off-main-thread, prevents UI blocking). Implements "A Tale of Two Clocks" pattern: JavaScript timer schedules notes 100-200ms in advance, Web Audio API handles precise timing on audio thread. Uses smplr for sample-based synthesis with SoundFont support.

5. **State Management (Zustand/Redux)** - Three stores: MIDI data (parsed structure), conversation history (chat messages), playback state (transport position). MIDI processing is client-side only - backend receives minimal context (track names, note counts, key signature), never full MIDI binary.

**Key architectural patterns:**
- **Token efficiency**: Send high-level structure (chord progression, form) as compact JSON, only detailed note data for edited region (2 bars before + 2 bars after, not entire song)
- **AudioWorklet scheduling**: Never use setTimeout for notes - schedule in batches using audioContext.currentTime to avoid drift/throttling
- **Structured output validation**: Use OpenAI's JSON schema mode with strict: true for guaranteed-valid responses (zero parsing errors)

### Critical Pitfalls

Research identified seven critical pitfalls with detailed prevention strategies. Top five impact MVP viability:

1. **LLM Musical Context Blindness** - LLMs generate syntactically valid but musically nonsensical MIDI. GPT-4 makes documented theory mistakes (E over G chord creating unintentional G6, only generating I-IV-V-I progressions). AVOID: Never send raw MIDI tokens - use structured JSON with musical semantics (key, scale degree, chord function). Always provide context (key signature, current chord progression, genre conventions, surrounding measures). Implement validation layer to check scale/key conformance, voice leading, and harmonic function after LLM edits.

2. **Token Budget Explosion** - 4-bar phrase can consume thousands of tokens, exhausts context window or burns budget at $50+ per edit. AVOID: Hierarchical tokenization (send chord progressions as "Cmaj7" not [C4, E4, G4, B4]), 10ms timing quantization (not 1ms), velocity quantization to 8 levels (not 128), smart context windowing (2 bars before/after edit region, not entire song), cache song context between edits.

3. **Browser Audio Clock Desynchronization** - MIDI playback drifts after a few minutes due to setTimeout unreliability (garbage collection delays, tab throttling, timer precision reduction for Spectre mitigations). AVOID: Never use setTimeout for scheduling - implement "A Tale of Two Clocks" pattern (JavaScript timer schedules 100-200ms ahead, Web Audio API handles precise timing), schedule in batches, account for timer drift by checking audioContext.currentTime on each tick.

4. **MIDI File Format Compatibility Hell** - Tempo stuck at 120 BPM (tempo events not in track 0), time signatures ignored, tracks merged unexpectedly. SMF Format 0 vs 1 confusion, running status handling, track chunk size wrong 50% of the time. AVOID: Use battle-tested parser (@tonejs/midi), support both SMF 0/1 on import, scan all tracks for tempo/time signature (not just track 0), export as SMF 1 by default, round-trip testing.

5. **Quantization Destroys Musical Feel** - LLM interprets "tighter timing" as 100% quantization, destroying groove/swing. AVOID: Never quantize at 100% strength (default 50-70%), genre-aware quantization (EDM 80-90%, jazz 30-50%), preserve swing templates, velocity humanization (vary 10-20% around target), provide preview with strength slider.

**Additional pitfalls:**
6. **Safari/iOS Lockout** - 40%+ users can't use Web MIDI API features. File-based workflow (upload/download .mid) works universally - make Web MIDI controller support optional enhancement, not core requirement.
7. **AI-Generated "Slop" Artifacts** - Edits sound generic/formulaic due to LLM training on low-quality MIDI. Constrain LLM to editing (not generation), preserve user's original style, inject sophistication via prompts, human-in-loop refinement.

## Implications for Roadmap

Based on combined research, recommended 6-phase structure with clear dependency ordering:

### Phase 1: Core MIDI Infrastructure
**Rationale:** Foundation for everything else - can't test LLM integration without MIDI data model, can't validate edits without playback. Client-side processing establishes token efficiency architecture early.

**Delivers:** MIDI import/export, parsed data store, basic playback

**Addresses:**
- MIDI Import/Export (FEATURES.md: table stakes)
- MIDI parser with Format 0/1 support (avoids Pitfall 4: Format Compatibility)
- Basic audio playback using Tone.js (FEATURES.md: must-have for validation)

**Avoids:**
- Pitfall 4 (MIDI Format Compatibility) - using @tonejs/midi with round-trip testing
- Server-side processing anti-pattern (ARCHITECTURE.md) - keeps all MIDI manipulation client-side

**Research flag:** LOW - standard patterns, well-documented libraries. Skip `/gsd:research-phase`.

---

### Phase 2: LLM Integration & Music Theory Validation
**Rationale:** Core value proposition - this is what differentiates Haydn. Must be built before UI polish to validate hypothesis that "natural language can replace piano roll manipulation for musically coherent edits."

**Delivers:** Single-shot completion endpoint, structured output schema, music theory validation layer, operation executor

**Addresses:**
- Natural Language Editing (FEATURES.md: core differentiator)
- Music Theory Engine (FEATURES.md: competitive advantage)
- Token efficiency strategy (avoids Pitfall 2: Token Budget Explosion)

**Avoids:**
- Pitfall 1 (LLM Musical Context Blindness) - implements validation layer with musical context
- Pitfall 2 (Token Budget Explosion) - hierarchical tokenization, minimal context windows
- Pitfall 7 (AI Slop) - quality filters, genre-specific rules, preserves user's original style

**Uses:**
- Node.js Express backend (STACK.md)
- OpenAI SDK with structured output (STACK.md, ARCHITECTURE.md)
- JSON schema validation (ARCHITECTURE.md: Pattern 2)

**Research flag:** HIGH - niche domain (LLM music theory integration), requires `/gsd:research-phase` for:
- Optimal tokenization format (balance between token count and musical context)
- Music theory validation rules (scale conformance, voice leading, genre conventions)
- Prompt engineering strategies for musical coherence

---

### Phase 3: Precise Audio Playback
**Rationale:** Validation depends on accurate timing - users can't evaluate "tighten the timing" edits if playback itself is sloppy. AudioWorklet architecture prevents technical debt from setTimeout-based implementations.

**Delivers:** AudioWorklet processor, "Tale of Two Clocks" scheduling, transport controls

**Addresses:**
- Playback Controls (FEATURES.md: table stakes)
- Tempo Control (FEATURES.md: must-have)

**Avoids:**
- Pitfall 3 (Audio Clock Desync) - AudioWorklet with lookahead scheduling
- ScriptProcessorNode anti-pattern (ARCHITECTURE.md: deprecated, blocks UI)

**Implements:**
- Pattern 3 from ARCHITECTURE.md (AudioWorklet for real-time synthesis)
- smplr integration for sample-based playback (STACK.md)

**Research flag:** MEDIUM - requires `/gsd:research-phase` for:
- AudioWorklet message passing patterns (main thread ↔ audio thread communication)
- Timing precision testing across browsers (Firefox timer reduction, Safari quirks)
- Sample loading strategies (lazy-load vs preload, memory management)

---

### Phase 4: Piano Roll Editor UI
**Rationale:** Once data layer is stable (Phase 1), LLM integration works (Phase 2), and playback is reliable (Phase 3), UI can be built without rework. Piano roll provides visual reference for NL edits and manual fallback when AI fails.

**Delivers:** Note display, track list, visual editor, chat interface

**Addresses:**
- Piano Roll Editor (FEATURES.md: table stakes)
- Basic Note Editing (FEATURES.md: must-have)
- Undo/Redo (FEATURES.md: essential safety net)

**Avoids:**
- Performance trap (PITFALLS.md) - virtual scrolling for >5000 notes
- UX pitfall (PITFALLS.md) - maintain scroll position after edits, show before/after comparison

**Research flag:** LOW - standard React canvas/WebGL patterns for rendering. Skip `/gsd:research-phase`.

---

### Phase 5: Conversational Mode & State Management
**Rationale:** Builds on single-shot foundation from Phase 2. Adds session persistence, sliding window context, multi-turn conversation support.

**Delivers:** Session CRUD API, conversation store, context windowing, chat UI enhancements

**Addresses:**
- Conversational editing (FEATURES.md: should-have for complex edits)
- Cloud storage (FEATURES.md: v1.x feature for multi-device access)

**Implements:**
- Pattern 4 from ARCHITECTURE.md (sliding window context management)
- Session storage schema (ARCHITECTURE.md: conversation state)

**Avoids:**
- Pitfall 2 (Token Budget Explosion) - sliding window keeps last 10 messages, prevents unbounded context growth
- Anti-pattern 5 (ARCHITECTURE.md: unbounded conversation context)

**Research flag:** MEDIUM - requires `/gsd:research-phase` for:
- Session storage strategy (Redis vs PostgreSQL vs Firestore)
- Context summarization techniques (compress old messages without losing coherence)
- Multi-turn prompt engineering (maintain musical context across conversation)

---

### Phase 6: Multi-Track & Advanced Editing Features
**Rationale:** After single-track workflow is validated (Phases 1-5), expand to multi-track for prompts like "add bass line" or "remove drums." Includes quantization, velocity editing, MIDI hardware input.

**Delivers:** Multi-track support (2-4 tracks), quantization with strength control, velocity editor, Web MIDI API integration

**Addresses:**
- Multi-track Support (FEATURES.md: v1.x feature)
- Quantization (FEATURES.md: should-have)
- Velocity Editing (FEATURES.md: should-have)
- MIDI Hardware Input (FEATURES.md: v1.x feature)

**Avoids:**
- Pitfall 5 (Quantization Destroys Feel) - genre-aware quantization, 50-70% default strength
- Pitfall 6 (Safari Lockout) - Web MIDI as optional enhancement with fallback messaging

**Research flag:** LOW - Multi-track data model is extension of single-track. Web MIDI API well-documented. Skip `/gsd:research-phase`.

---

### Phase Ordering Rationale

**Why this order:**
1. **Dependencies drive sequence**: Can't test LLM without MIDI data (Phase 1 before 2), can't validate edits without playback (Phase 3 before complex features), can't build stable UI before data layer (Phase 4 after 1-3)
2. **Risk mitigation front-loaded**: Critical pitfalls (token budget, musical quality, timing precision) addressed in Phases 1-3 before UI polish
3. **Hypothesis validation early**: Core value prop (natural language editing with theory validation) tested in Phase 2, before investing in advanced features
4. **Standard patterns deferred**: Piano roll UI (Phase 4) and multi-track (Phase 6) use well-documented patterns - can be built quickly once foundation is solid

**Groupings by architecture:**
- **Phases 1-3**: Backend processing layer (MIDI, LLM, Audio)
- **Phase 4**: UI/presentation layer
- **Phase 5**: State/persistence layer
- **Phase 6**: Feature expansion

**Pitfall prevention mapping:**
- Phase 1 addresses Pitfall 4 (Format Compatibility)
- Phase 2 addresses Pitfalls 1, 2, 7 (Musical Blindness, Token Budget, AI Slop)
- Phase 3 addresses Pitfall 3 (Audio Clock Desync)
- Phase 5 prevents token overflow in conversations
- Phase 6 addresses Pitfalls 5, 6 (Quantization Feel, Safari Lockout)

### Research Flags

**Needs deeper research during planning:**
- **Phase 2 (LLM Integration)**: Tokenization format optimization, music theory validation rules, prompt engineering for genre-specific edits (complex, niche domain, sparse academic research)
- **Phase 3 (Audio Playback)**: AudioWorklet message passing, cross-browser timing precision testing, sample loading strategies (browser-specific quirks)
- **Phase 5 (Conversational Mode)**: Session storage architecture, context summarization techniques, multi-turn conversation coherence (design decisions with trade-offs)

**Standard patterns (skip research-phase):**
- **Phase 1 (MIDI Infrastructure)**: @tonejs/midi is battle-tested, File API is standard
- **Phase 4 (Piano Roll UI)**: Canvas rendering patterns well-documented, React component libraries available
- **Phase 6 (Multi-Track)**: Extension of Phase 1 patterns, Web MIDI API has official specs

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified via GitHub releases and official docs. Version compatibility confirmed. Only uncertainty is smplr pre-1.0 API stability (MEDIUM confidence). |
| Features | MEDIUM-HIGH | Feature landscape verified via competitor analysis (Soundtrap, Signal MIDI, BandLab) and DAW comparisons. Natural language editing is differentiator, but market demand not proven (inferred from Logic Chord ID adoption). |
| Architecture | HIGH | Patterns verified via official Web Audio API docs, real-world example (Signal MIDI GitHub), and authoritative sources (MDN, W3C specs). Client-side processing + backend LLM orchestration is standard pattern. |
| Pitfalls | MEDIUM-HIGH | Browser limitations verified (Web MIDI compatibility, timer precision). LLM musical quality issues documented (OpenAI community, research papers). MIDI format quirks confirmed (MIDI.org, Ableton docs). Lower confidence on exact token usage ratios (needs empirical testing). |

**Overall confidence:** MEDIUM-HIGH

Research is sufficient to proceed with roadmap definition and MVP planning. Key unknowns are expected (LLM tokenization optimization, music theory validation rules) and flagged for phase-specific research.

### Gaps to Address

**During Phase 2 planning:**
- Exact token efficiency ratio for different MIDI representations (estimated 5-10x, needs measurement with GPT-4o)
- Music theory validation rules specificity (which voice leading rules apply to which genres?)
- Optimal balance between musical context and token budget (how much surrounding context is "enough"?)

**During Phase 3 planning:**
- AudioWorklet browser compatibility edge cases (older Safari versions, Firefox on Linux)
- Sample library licensing (smplr uses hosted samples - what's the fallback if service goes down?)
- Timing precision variance across devices (desktop vs mobile, high-end vs low-end CPUs)

**During Phase 5 planning:**
- Session storage cost modeling (Redis vs PostgreSQL for 1k, 10k, 100k users)
- Context summarization quality (does summarizing old messages lose critical musical decisions?)

**Validation during implementation:**
- smplr API stability (pre-1.0 status means breaking changes possible - monitor GitHub releases)
- Token budget empirical testing (measure actual costs with real-world MIDI files of varying complexity)
- Musical quality A/B testing (can users distinguish Haydn's AI edits from human edits? Blind listening tests recommended)

**Business model validation:**
- LLM API cost sustainability (what's the COGS per user per month at projected usage?)
- Freemium tier limits (how many edits before requiring payment?)

## Sources

### Primary (HIGH confidence)
- [Tone.js GitHub Releases](https://github.com/Tonejs/Tone.js/releases) - v14.7.39 verified
- [webmidi GitHub Releases](https://github.com/djipco/webmidi/releases) - v3.1.14 verified
- [OpenSheetMusicDisplay GitHub](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) - v1.9.4 release date 2026-01-19
- [smplr GitHub README](https://github.com/danigb/smplr) - Pre-1.0 status, soundfont-player deprecation confirmed
- [Web MIDI API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) - Standard specification
- [W3C Web MIDI API Spec](https://www.w3.org/TR/webmidi/) - Published 2025-01-21
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Official documentation
- [A Tale of Two Clocks - Web Audio Scheduling](https://web.dev/audio-scheduling/) - Google official guide
- [Understanding MIDI Files - Ableton](https://help.ableton.com/hc/en-us/articles/209068169-Understanding-MIDI-files) - Format 0/1 differences
- [Tempo Map and MIDI Files - MIDI.org](https://midi.org/community/midi-specifications/tempo-map-and-midi-files-of-format-1) - Official spec clarifications

### Secondary (MEDIUM confidence)
- [Signal MIDI Editor](https://signalmidi.app/) + [GitHub](https://github.com/ryohey/signal) - Real-world web MIDI editor architecture example
- [MIDI-LLM Research Paper](https://arxiv.org/abs/2511.03942) - Tokenization strategies, published 2025
- [Can LLMs "Reason" in Music?](https://arxiv.org/html/2407.21531v1) - Documents GPT-4 music theory errors
- [Vite vs Next.js comparison](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) - Framework selection rationale
- [OpenAI API Best Practices](https://www.openassistantgpt.io/blogs/openai-api-integration-best-practices) - Security and optimization
- [Token efficiency with structured output](https://medium.com/data-science-at-microsoft/token-efficiency-with-structured-output-from-language-models-be2e51d3d9d5) - Microsoft research
- [Context Window Management Strategies](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - Sliding window patterns
- [5 MIDI Quantization Tips](https://midi.org/5-midi-quantization-tips) - MIDI.org official guidance
- [Quantization in Music](https://blog.landr.com/quantization-in-music/) - LANDR educational content

### Tertiary (LOW confidence, needs validation)
- smplr version stability - Pre-1.0 means API subject to change, monitor for breaking updates
- Exact token savings ratio (5-10x) - Estimated based on MIDI structure analysis, needs empirical GPT-4o testing
- LLM musical quality patterns - Based on community reports and limited research, anecdotal evidence
- Safari Web MIDI API timeline - "Announced 2020, still unsupported in 2026" based on Can I Use data, but Apple could change stance

---
*Research completed: 2026-01-23*
*Ready for roadmap: yes*
