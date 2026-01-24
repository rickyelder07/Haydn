# Feature Landscape: MIDI Editing and Music Production Web Applications

**Domain:** Web-based MIDI editor and music production tool
**Researched:** 2026-01-23
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Piano Roll Editor** | Universal MIDI editing interface. Every MIDI tool has one. | MEDIUM | Core UI component. Must support note input, selection, editing |
| **MIDI Import/Export** | Users need to move files between DAWs and tools | LOW-MEDIUM | Standard MIDI File (SMF) format. Type 0/1 support. Must preserve tempo, velocity, all MIDI data |
| **Basic Note Editing** | Add, delete, move, resize notes | LOW | Click-to-add, drag to move/resize. Selection tools |
| **Velocity Editing** | Control note dynamics (volume/intensity) | LOW-MEDIUM | Visual velocity editor below piano roll. Click-drag to adjust |
| **Playback Controls** | Play, pause, stop, loop | LOW | Standard transport controls expected by all users |
| **Tempo Control** | Set BPM for the project | LOW | Input field or slider for tempo adjustment |
| **Time Signature Support** | 4/4, 3/4, and other signatures | LOW-MEDIUM | Most projects are 4/4, but flexibility required |
| **Snap to Grid** | Align notes to rhythmic divisions | MEDIUM | Essential for precise editing. Toggle on/off, adjustable grid resolution |
| **Quantization** | Correct timing of notes to grid | MEDIUM | Apply after recording. Strength parameter (0-100%). Per-note or selection |
| **Undo/Redo** | Revert mistakes | LOW | Unlimited history expected. Keyboard shortcuts (Cmd/Ctrl+Z) |
| **Audio Playback** | Hear MIDI notes as audio | MEDIUM | Web Audio API + SoundFont or synthesis. Desktop DAWs use VST plugins |
| **Multi-track Support** | Separate tracks for different instruments | MEDIUM-HIGH | Track management UI. Web editors often limit to 1-8 tracks vs DAW's unlimited |
| **Keyboard Shortcuts** | Speed up common actions | LOW-MEDIUM | Copy/paste, delete, select all, play/pause minimum |
| **Save/Load Projects** | Persist work between sessions | MEDIUM | Desktop = file system. Web = localStorage, cloud, or downloads |
| **Zoom Controls** | Navigate large projects | LOW | Horizontal (time) and vertical (pitch) zoom required |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Natural Language Editing** | Revolutionary UX - "make this jazzy" vs manual note tweaking | HIGH | **Core differentiator for Haydn**. Requires LLM integration, music theory engine, context preservation |
| **AI-Powered Music Theory** | Intelligent suggestions that follow theory rules | HIGH | Chord progression analysis, scale detection, voicing suggestions. E.g., Apple Logic Pro's Chord ID (2026) |
| **Real-Time Collaboration** | Multiple users editing simultaneously | HIGH | WebSocket infrastructure. Soundtrap, BandLab offer this. Rare in desktop DAWs |
| **Cloud Storage & Sync** | Access projects from any device | MEDIUM | Web-native advantage over desktop tools. Auto-save + version history |
| **No Installation Required** | Browser-based = instant access | N/A | Fundamental web advantage. Lower barrier to entry |
| **MIDI Hardware Integration** | Connect physical MIDI keyboards via Web MIDI API | MEDIUM | Real-time input recording. Desktop parity. Signal MIDI, Soundtrap have this |
| **Advanced CC Automation** | Edit pitch bend, modulation, expression (CC11+) | MEDIUM-HIGH | Professional feature. Most web editors lack this. Signal MIDI supports it |
| **SoundFont Support** | Custom instrument sounds beyond basic synthesis | MEDIUM | Better than basic Web Audio tones. Still inferior to VST/AU plugins |
| **Smart Quantization** | Context-aware timing correction (preserve groove) | HIGH | Goes beyond simple grid snap. Understands swing, humanization |
| **Chord Detection & Editing** | Visual chord track, generate progressions | MEDIUM-HIGH | Scaler 3, Captain Chords offer this. Powerful for theory-challenged users |
| **Pattern/Loop Library** | Pre-made MIDI loops to customize | LOW-MEDIUM | Soundtrap has "1000s of drum sounds and packs". Lowers creation barrier |
| **Notation View** | Sheet music alongside piano roll | HIGH | Cubase's Score Editor strength. Composers value this. Rare in web tools |
| **MIDI Effects/Transforms** | Arpeggiate, humanize, randomize, transpose | MEDIUM | Batch operations on selections. Desktop DAWs have extensive libraries |
| **Export to Multiple Formats** | MIDI, WAV, MP3, stems | MEDIUM | Soundtrap exports PDF, MIDI, MP3, DXF. More = more flexibility |
| **Offline Mode / PWA** | Work without internet via Progressive Web App | MEDIUM | Signal MIDI installable from app stores. Hybrid web/native approach |
| **Velocity Layers** | Multiple samples per note at different velocities | HIGH | Realistic instrument playback. VST-level feature rarely in web |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full DAW Feature Parity** | "Why can't it do everything Ableton does?" | Web platform limitations (VST plugins, low latency, file system access). Bloated UX dilutes focus. | **Focus on MIDI editing excellence**. Let users export to their DAW for mixing/mastering |
| **Unlimited Track Count** | "I need 100+ tracks!" | Performance degrades in browser (memory, audio threads). Desktop DAWs struggle too. | **Cap at 8-16 tracks**. Encourage bouncing/consolidation. Export to DAW if needed |
| **Advanced Audio Recording** | "Record vocals with it!" | Audio recording is desktop DAW territory (drivers, latency, processing). Scope creep. | **MIDI focus only**. Maybe support audio import for reference, not multitrack recording |
| **VST/AU Plugin Support** | "I want my Serum synth!" | Impossible in browser sandbox. VST = native code. | **SoundFont + Web Audio synthesis**. Good enough for preview. Export MIDI to DAW for final sound |
| **Everything Customizable** | "Let me change every color/hotkey" | Maintenance nightmare. Analysis paralysis for users. | **Opinionated defaults with 2-3 themes**. Focus on core editing workflow |
| **Real-Time Everything** | "Live collaborate on every note!" | Network latency, conflict resolution complexity, diminishing returns. | **Async collaboration** - share projects, not simultaneous editing. Or room-based collaboration, not per-note |
| **Complex Mixing/Mastering** | "Add EQ, compression, reverb..." | Desktop DAW strength. Web audio quality lower. Mission creep. | **Basic volume/pan per track max**. Export MIDI to professional mixing tools |
| **Built-in Sample Library** | "Include 50GB of sounds!" | Storage/bandwidth costs explode. Licensing issues. Slow load times. | **SoundFont support + links to free libraries**. Users bring their own or use defaults |

## Feature Dependencies

```
Core Foundation:
    Piano Roll Editor
        ├──requires──> Audio Playback (hear what you edit)
        ├──requires──> MIDI Data Model (store notes, velocity, etc.)
        └──requires──> Snap to Grid (precise editing)

File I/O:
    MIDI Import
        └──enables──> Edit Existing Files (vs create-only tool)
    MIDI Export
        └──requires──> Complete MIDI Data Model (preserve all info)

Natural Language Editing (Haydn's Core):
    Natural Language Interface
        ├──requires──> Music Theory Engine (understand "jazzy")
        ├──requires──> Context Preservation (maintain existing structure)
        ├──requires──> LLM Integration (GPT-4o)
        └──enhances──> All Editing Features (alternative input method)

Collaboration:
    Real-Time Collaboration
        ├──requires──> Cloud Storage (shared state)
        ├──requires──> WebSocket Infrastructure (live updates)
        └──conflicts──> Offline Mode (can't sync without network)

Advanced Features:
    Chord Detection
        └──enhances──> Natural Language Editing (theory context)
    Quantization
        └──enhances──> Natural Language Editing ("tighten timing")
    MIDI Hardware Input
        └──requires──> Web MIDI API Support (browser compatibility)
```

### Dependency Notes

- **Piano Roll requires Audio Playback:** Users can't validate edits without hearing them. Playback is non-negotiable.
- **Natural Language requires Music Theory Engine:** "Make this jazzy" is meaningless without understanding jazz chord voicings, swing feel, etc.
- **Export requires complete data model:** Can't export tempo changes if your model doesn't track them. Must preserve all MIDI CC data.
- **Multi-track enhances Natural Language:** "Add a bass line" requires track infrastructure.
- **Real-Time Collaboration conflicts with Offline Mode:** Can't build both fully. Pick one or hybrid (async collaboration).

## MVP Definition

### Launch With (v1) - Haydn Core

Minimum viable product — what's needed to validate natural language MIDI editing.

- [x] **Piano Roll Editor** — Visual reference for natural language edits. Must show results.
- [x] **Basic Note Editing** — Manual fallback when NL fails. Add/delete/move notes.
- [x] **Natural Language Editing Interface** — CORE DIFFERENTIATOR. Text input → GPT-4o → MIDI transformation.
- [x] **Music Theory Engine** — Ensures NL edits are musically coherent (scales, chords, rhythm).
- [x] **Audio Playback** — Validate edits by ear. SoundFont-based or basic Web Audio synthesis.
- [x] **MIDI Import/Export** — Users bring Logic/Ableton projects, edit, export back to DAW.
- [x] **Undo/Redo** — Essential safety net when AI makes bad suggestions.
- [x] **Tempo Control** — Set context for NL edits ("add quarter note bass line" needs tempo).
- [x] **Single Track** — Simplify scope. Most NL edits target one instrument at a time.
- [x] **Save/Load (Cloud or Local)** — Persist work. Doesn't need to be fancy.

**Why these features:** Validate core hypothesis - "Natural language can replace piano roll manipulation for musically coherent edits." Everything else is table stakes to make this testable.

### Add After Validation (v1.x)

Features to add once core natural language editing works and users want more.

- [ ] **Multi-track Support (2-4 tracks)** — NL prompt: "Add a bass line" requires second track. Start with small count.
- [ ] **Quantization** — NL prompt: "Tighten the timing" maps to quantization. Manual fallback needed too.
- [ ] **Velocity Editing** — NL prompt: "Make it more dynamic" adjusts velocities. Visual editor for manual tweaks.
- [ ] **MIDI Hardware Input** — Record from keyboard, then use NL to fix mistakes. Web MIDI API integration.
- [ ] **Chord Detection** — Show chord symbols above piano roll. Context for NL edits ("change this to minor").
- [ ] **Snap to Grid (Toggle)** — Users want manual precision sometimes. Configurable grid resolution.
- [ ] **Time Signature Support** — Most music is 4/4, but 3/4, 6/8 needed for broader use cases.
- [ ] **Keyboard Shortcuts** — Power users demand speed. Play/pause, copy/paste, undo/redo minimum.
- [ ] **Cloud Storage** — If local storage validates, upgrade to cloud for multi-device access.

**Trigger for adding:** Users request these features explicitly, or NL edits fail without them (e.g., "add bass line" fails without multi-track).

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Real-Time Collaboration** — High complexity, unclear demand for MIDI editing (vs DAW mixing).
- [ ] **Advanced CC Automation** — Professional feature. Niche use case. Desktop DAW territory.
- [ ] **Notation View** — Composers love it, but high complexity. Not differentiating for NL editing focus.
- [ ] **Pattern/Loop Library** — Nice-to-have for beginners. Doesn't enhance NL editing core value.
- [ ] **MIDI Effects/Transforms** — Desktop DAW strength. Could be exposed via NL ("arpeggiate this"), but defer.
- [ ] **SoundFont Support** — Better audio quality. Not critical for edit validation. Basic synthesis sufficient early on.
- [ ] **Offline Mode / PWA** — Engineering overhead. Cloud-first simpler for MVP.
- [ ] **Export to Multiple Formats** — MIDI export sufficient. WAV/MP3 nice-to-have later.

**Why defer:** These don't validate the core natural language editing hypothesis. Add when scaling, not during initial validation.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Natural Language Editing | HIGH | HIGH | **P1** |
| Music Theory Engine | HIGH | HIGH | **P1** |
| Piano Roll Editor | HIGH | MEDIUM | **P1** |
| MIDI Import/Export | HIGH | LOW | **P1** |
| Audio Playback | HIGH | MEDIUM | **P1** |
| Undo/Redo | HIGH | LOW | **P1** |
| Basic Note Editing | HIGH | LOW | **P1** |
| Multi-track Support (2-4) | MEDIUM | MEDIUM | **P2** |
| Quantization | MEDIUM | MEDIUM | **P2** |
| Velocity Editing | MEDIUM | LOW | **P2** |
| MIDI Hardware Input | MEDIUM | MEDIUM | **P2** |
| Chord Detection | MEDIUM | MEDIUM | **P2** |
| Cloud Storage | MEDIUM | MEDIUM | **P2** |
| Snap to Grid | MEDIUM | LOW | **P2** |
| Keyboard Shortcuts | MEDIUM | LOW | **P2** |
| Real-Time Collaboration | LOW | HIGH | **P3** |
| Advanced CC Automation | LOW | HIGH | **P3** |
| Notation View | LOW | HIGH | **P3** |
| Pattern Library | LOW | MEDIUM | **P3** |
| MIDI Effects/Transforms | LOW | MEDIUM | **P3** |
| SoundFont Support | LOW | MEDIUM | **P3** |
| Offline Mode / PWA | LOW | MEDIUM | **P3** |
| Export Multiple Formats | LOW | MEDIUM | **P3** |

**Priority key:**
- **P1: Must have for launch** - Validates core hypothesis (natural language MIDI editing)
- **P2: Should have, add when possible** - Enhances core value or enables broader use cases
- **P3: Nice to have, future consideration** - Professional features or non-core differentiators

## Web-Specific Considerations

### Web Advantages (Lean Into These)

| Feature | Why Web Wins | Implementation |
|---------|--------------|----------------|
| **Zero Installation** | Instant access in browser. No 5GB download. | Deploy to Vercel/Netlify. CDN for assets. |
| **Cross-Platform** | Works on Mac, Windows, Linux, tablets identically. | Responsive design. Touch-friendly controls. |
| **Shareable Links** | "Here's my project: [URL]" vs emailing .logic files. | URL-based project IDs. Public/private sharing. |
| **Auto-Updates** | No "update available" nags. Always latest version. | CI/CD pipeline. Feature flags for rollouts. |
| **Cloud Storage** | Access projects anywhere. No USB drives. | Firebase, Supabase, or AWS S3 backend. |
| **Lower Barrier to Entry** | No $200 Logic Pro purchase. Freemium model. | Free tier with limits. Paid for exports/storage. |

### Web Limitations (Work Around or Accept)

| Limitation | Why It Hurts | Mitigation Strategy |
|------------|--------------|---------------------|
| **No VST/AU Plugins** | Can't use pro synths/effects. | Accept it. Focus on MIDI editing, export to DAW for sound design. |
| **Higher Audio Latency** | MIDI input feels sluggish vs desktop. | Use Web Audio API low-latency mode. Warn users with slow connections. |
| **Browser Compatibility** | Safari lacks Web MIDI API support. | Feature detection. Graceful degradation. "Use Chrome" message. |
| **Limited File System Access** | Can't auto-save to Desktop like Logic. | File System Access API (Chrome) or download MIDI files. Cloud storage primary. |
| **Memory Constraints** | Large projects (100+ tracks) crash browser. | Cap track count. Optimize rendering (virtualized piano roll). |
| **No Native Speed** | Audio synthesis slower than native C++ VSTs. | Use WebAssembly for audio processing. Pre-render common sounds. |

## Competitor Feature Analysis

| Feature | Soundtrap (Web DAW) | Signal MIDI (Web Editor) | BandLab (Web DAW) | Desktop DAWs (Logic/Ableton) | Haydn (Planned) |
|---------|---------------------|--------------------------|-------------------|------------------------------|-----------------|
| Piano Roll Editor | ✅ Comprehensive | ✅ Multi-track | ✅ Full-featured | ✅ Advanced | ✅ Core |
| MIDI Import/Export | ✅ MIDI + more formats | ✅ MIDI files | ✅ MIDI files | ✅ Universal | ✅ MIDI focus |
| Audio Playback | ✅ VST-quality instruments | ✅ SoundFont support | ✅ Full DAW audio | ✅ Native VST/AU | ✅ Web Audio/SoundFont |
| Multi-track | ✅ Unlimited | ✅ Multi-track | ✅ Unlimited | ✅ Unlimited | ⚠️ 1 (v1) → 4 (v1.x) |
| Real-Time Collaboration | ✅ Core feature | ❌ No | ✅ Core feature | ❌ Rare | ❌ Defer to v2+ |
| Cloud Storage | ✅ Cloud-first | ⚠️ PWA local | ✅ Cloud-first | ❌ Local files | ✅ Planned v1.x |
| Natural Language Editing | ❌ No | ❌ No | ❌ No | ⚠️ Limited (Logic Chord ID) | ✅ **CORE DIFFERENTIATOR** |
| Music Theory Engine | ⚠️ Basic (loops) | ❌ No | ⚠️ Basic (loops) | ⚠️ Some (Scaler plugin) | ✅ **CORE DIFFERENTIATOR** |
| MIDI Hardware Input | ✅ Via Web MIDI | ✅ Via Web MIDI | ✅ Via Web MIDI | ✅ Native MIDI | ✅ Planned v1.x |
| Quantization | ✅ Standard | ⚠️ Basic | ✅ Standard | ✅ Advanced | ✅ Planned v1.x |
| Velocity Editing | ✅ Visual editor | ✅ Visual editor | ✅ Visual editor | ✅ Advanced | ✅ Planned v1.x |
| CC Automation | ⚠️ Limited | ✅ Full support | ⚠️ Limited | ✅ Advanced | ❌ Defer to v2+ |
| Notation View | ❌ No | ❌ No | ❌ No | ✅ Logic/Cubase have it | ❌ Defer to v2+ |
| Offline Mode | ❌ Requires internet | ✅ PWA installable | ⚠️ Limited | ✅ Native apps | ❌ Defer to v2+ |
| Price | $6.99+/mo subscription | Free (open source) | Free + Premium $4.99/mo | $200-600 one-time | TBD (Freemium likely) |

### Key Insights from Competitor Analysis

**Web DAWs (Soundtrap, BandLab) position as full production environments:**
- Heavy on collaboration and cloud storage
- Target beginners and casual creators
- Try to replace desktop DAWs entirely
- Miss opportunity for focused MIDI editing excellence

**Specialized MIDI Editors (Signal) focus on editing workflow:**
- No bloat from audio recording features
- Strong SoundFont support and CC automation
- Open source, but lacks differentiating features (no AI)
- Desktop PWA model interesting (installable web app)

**Desktop DAWs remain gold standard for production:**
- VST/AU plugin ecosystem unbeatable
- Low latency, high performance
- But expensive, complex, and intimidating
- Slow to adopt AI (Logic's 2026 Chord ID is rare exception)

**Haydn's Opportunity:**
- No one has nailed natural language MIDI editing yet
- AI tools (MIDI Agent, CreateMusicAI) are plugins or full DAWs, not focused editors
- Music theory integration rare (mostly in expensive plugins like Scaler)
- Web delivery removes barriers to trying AI-powered editing

## Sources

### Web-Based MIDI Editors (2026):
- [The 10 Best Online MIDI Editors to Try in 2026](https://www.topmediai.com/ai-music/midi-editor-online/)
- [The Top Five Online MIDI Editors](https://blog.staccato.ai/The-Top-Five-Online-MIDI-Editors)
- [Signal MIDI Editor](https://signalmidi.app/)
- [Soundtrap Online MIDI Editor](https://www.soundtrap.com/content/product/online-midi-editor)
- [Free Online MIDI Editor - Edit, Quantize & Remix in Browser](https://miditoolbox.com/editor)

### DAW MIDI Features:
- [Best DAWs of 2026: Top Audio Workstations](https://www.podcastvideos.com/articles/best-daws-2026/)
- [The 10 Best DAWs for 2026 | LANDR](https://blog.landr.com/best-daw/)
- [Best DAW for MIDI editing? - Gearspace](https://gearspace.com/board/music-computers/1407233-best-daw-midi-editing.html)
- [Electronic DAWs Compared: MIDI, Samplers, FX and Automation](https://dj.studio/blog/electronic-production-daws-midi-samplers-fx-automation)

### MIDI File Management:
- [Best Practices For Sharing MIDI Files Between DAWs](https://www.macprovideo.com/article/fl-studio/best-practices-for-sharing-midi-files-between-daws)
- [Transferring Projects Between Different DAWs](https://www.soundonsound.com/techniques/transferring-projects-between-different-daws)

### MIDI Editing Features:
- [Quantization in Music: How To Fix MIDI and Audio Timing | LANDR](https://blog.landr.com/quantization-in-music/)
- [Editing MIDI Notes and Velocities — Ableton Reference Manual Version 12](https://www.ableton.com/en/live-manual/12/editing-midi/)
- [MIDI Editing: 6 Essential Tips for Better MIDI Tracks | LANDR](https://blog.landr.com/midi-editing/)

### AI & Natural Language Music Production:
- [AI MIDI Generator - MIDI Agent AI VST / AU Plugin](https://www.midiagent.com/)
- [TechFusion Labs Launches CreateMusicAI.ai](https://laotiantimes.com/2026/01/20/techfusion-labs-launches-createmusicai-ai-a-browser-based-studio-merging-generative-ai-with-professional-audio-engineering/)
- [Midify: AI-Enhanced Music Production - Custom LLM Integration](https://ailmind.com/portfolio/midify/)
- [Apple expands Logic Pro's AI features with Chord ID](https://www.musicradar.com/music-tech/apple-expands-logic-pros-ai-features-with-a-synth-player-and-a-personal-music-theory-expert-that-can-generate-chord-progressions-from-any-audio-or-midi-recording-that-you-play-it)

### Music Theory & Chord Progression Tools:
- [10 Best Chord Progression Generator Plugins in 2026](https://pluginerds.com/10-best-chord-generator-plugins/)
- [The 8 Best Chord Progression Generators for Quick Inspiration in 2026](https://blog.landr.com/best-chord-progression-generators/)
- [Hookpad Songwriting Software](https://www.hooktheory.com/hookpad)

### Browser Audio & MIDI Technology:
- [GitHub - feross/timidity: Play MIDI files in the browser w/ Web Audio](https://github.com/feross/timidity)
- [GitHub - Ameobea/web-synth: Browser-based DAW and audio synthesis platform](https://github.com/Ameobea/web-synth)
- [html-midi-player | Play and display MIDI files online](https://cifkao.github.io/html-midi-player/)

### Web vs Desktop DAW Comparisons:
- [Comparison of MIDI editors and sequencers - Wikipedia](https://en.wikipedia.org/wiki/Comparison_of_MIDI_editors_and_sequencers)

### Workflow & Shortcuts:
- [MIDI Editing In Pro Tools](https://www.soundonsound.com/techniques/midi-editing-pro-tools)
- [Live Keyboard Shortcuts — Ableton Reference Manual Version 12](https://www.ableton.com/en/manual/live-keyboard-shortcuts/)
- [HOW TO: Set Up REAPER's MIDI Editor for Better Workflow](https://seventhsam.com/blogs/tutorials/posts/6791049/how-to-set-up-reaper-s-midi-editor-for-better-workflow)

### Grid & Timing Features:
- [Snap To Grid - InSync | Sweetwater](https://www.sweetwater.com/insync/snap-to-grid/)
- [Bandlab Snap To Grid: What Is It and How to Use It](https://makemusicwith.me/bandlab-snap-to-grid/)

---
*Feature research for: Web-based MIDI editor with natural language editing (Haydn)*
*Researched: 2026-01-23*
*Confidence: MEDIUM-HIGH (verified via multiple sources, cross-referenced web editors and desktop DAWs)*
