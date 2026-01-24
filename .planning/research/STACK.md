# Technology Stack Research

**Project:** Haydn - Natural Language MIDI Editor
**Domain:** Web-based MIDI editing and music production
**Researched:** 2026-01-23
**Overall Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Frontend Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^18.x | UI framework | Industry standard for interactive web apps, excellent ecosystem for audio visualization components |
| TypeScript | ^5.x | Type safety | Critical for MIDI data structures and music theory logic; prevents runtime errors with complex data manipulation |
| Vite | ^6.x | Build tool & dev server | Lightning-fast HMR for rapid iteration, minimal overhead for client-side audio processing, superior DX compared to webpack |

**Rationale:** Chose Vite over Next.js because Haydn is a client-side audio application with no SEO requirements or server-side rendering needs. Vite provides faster development iteration and direct control over Web Audio API without SSR overhead.

**Confidence:** HIGH (verified via official sources and ecosystem consensus)

### MIDI Manipulation Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| @tonejs/midi | ^2.x | MIDI file parsing & writing | De facto standard for MIDI-to-JSON conversion; actively maintained by Tone.js team; human-readable JSON format minimizes LLM token usage |
| webmidi | ^3.1.14 | Web MIDI API wrapper | Full TypeScript support; simplifies Web MIDI API with high-level functions (playNote, sendPitchBend); Node.js support for server-side processing |
| Tone.js | ^14.7.39 | Web Audio framework | Industry-leading audio synthesis framework; required for MIDI playback; Transport system for precise timing |

**Token Efficiency Strategy:**
- Use @tonejs/midi to convert MIDI files to JSON before sending to GPT-4o
- JSON format is ~5-10x more token-efficient than raw MIDI binary
- Allows LLM to reason about musical structures (notes, chords, rhythms) instead of byte arrays
- Apply edits via library APIs rather than having LLM generate raw MIDI data

**Confidence:** HIGH (@tonejs/midi, webmidi, Tone.js verified via GitHub releases and official docs)

### Audio Playback

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| smplr | ^0.x (pre-1.0) | Sample-based instrument playback | Modern replacement for deprecated soundfont-player; high-quality samples hosted online (no server setup); built-in reverb; excellent DX |
| Tone.js | ^14.7.39 | Audio engine | Powers smplr under the hood; handles Web Audio context management and scheduling |

**Alternative considered:** soundfont-player (DEPRECATED - archived May 2023, author recommends smplr)

**Note:** smplr is pre-1.0 and API may change, but it's actively maintained and represents current best practice for web-based sample playback.

**Confidence:** MEDIUM-HIGH (smplr is pre-stable but recommended by soundfont-player author; Tone.js is battle-tested)

### MusicXML Support

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| opensheetmusicdisplay | ^1.9.4 | MusicXML parsing & rendering | Most actively maintained MusicXML library; TypeScript-first; comprehensive tag support; can render to SVG or parse-only mode |

**Use case:** Import MusicXML files, parse to internal representation, convert to MIDI JSON for editing

**Confidence:** HIGH (latest release 2026-01-19, official GitHub verified)

### Backend API

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | ^20.x LTS | Runtime | Required for GPT-4o API calls (cannot expose API key in frontend); matches frontend TypeScript ecosystem |
| Express | ^4.x | API framework | Lightweight, well-understood, minimal overhead for simple proxy API to OpenAI |
| OpenAI SDK | ^4.x | GPT-4o integration | Official SDK; handles streaming, retries, error handling; TypeScript support |

**Architecture:** Thin backend proxy that receives MIDI JSON from frontend, constructs GPT-4o prompts, streams responses back. All MIDI manipulation happens client-side via @tonejs/midi.

**Confidence:** HIGH (industry standard stack for OpenAI integration)

### File Handling

| Approach | Purpose | Implementation |
|----------|---------|----------------|
| Browser File API | Upload MIDI/MusicXML | Standard `<input type="file">` with FileReader API; parse binary to JSON via @tonejs/midi or OSMD |
| Blob/Download API | Export MIDI files | Use @tonejs/midi to write JSON back to binary MIDI, create Blob, trigger download |

**No external libraries needed** - native browser APIs are sufficient for single-session file handling.

**Confidence:** HIGH (standard web platform APIs)

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code quality | TypeScript-aware linting for music theory logic |
| Prettier | Code formatting | Standard configuration |
| Vitest | Unit testing | Vite-native test runner; fast for testing MIDI transformation logic |

## Installation

```bash
# Frontend
npm create vite@latest haydn -- --template react-ts
cd haydn

# Core dependencies
npm install tone @tonejs/midi webmidi smplr opensheetmusicdisplay

# Dev dependencies
npm install -D @types/node vitest

# Backend (separate directory)
mkdir server && cd server
npm init -y
npm install express openai cors dotenv
npm install -D @types/express @types/cors typescript tsx nodemon
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite | Next.js | No SSR/SEO needed; Vite is faster for client-side audio apps; architectural freedom for Web Audio API |
| MIDI parsing | @tonejs/midi | midi-parser-js | @tonejs/midi has better write support and is maintained by Tone.js ecosystem |
| MIDI parsing | @tonejs/midi | MidiPlayerJS | MidiPlayerJS focuses on playback scheduling; @tonejs/midi is better for data manipulation |
| Soundfont | smplr | soundfont-player | soundfont-player is DEPRECATED (archived 2023); author recommends smplr |
| Soundfont | smplr | WebAudioFont | WebAudioFont requires manual soundfont management; smplr handles hosting automatically |
| MusicXML | OSMD | musicxml-interfaces | OSMD provides parsing + optional rendering; musicxml-interfaces is lower-level and less maintained |
| Backend | Express | Fastify | Express is more familiar for simple proxy; marginal performance difference for single-user sessions |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| MIDI.js | Outdated (last updated 2014); poor browser support | Tone.js + @tonejs/midi |
| soundfont-player | DEPRECATED (archived May 2023) | smplr |
| Webpack | Slower dev experience, complex config | Vite |
| Safari as development browser | Safari does NOT support Web MIDI API due to fingerprinting concerns (as of 2020, still unimplemented) | Chrome, Firefox, Edge for development |

## Stack Patterns by Use Case

### For Token Efficiency (Primary Goal)

**MIDI → JSON → LLM → JSON → MIDI Pipeline:**

1. **Upload:** User uploads MIDI file
2. **Parse:** `@tonejs/midi` converts to JSON (compact, human-readable)
3. **Contextualize:** Extract music theory metadata (key, time signature, tempo, chord progressions) via custom analysis functions
4. **Prompt:** Send JSON + metadata + user request to GPT-4o
5. **Apply:** Parse LLM response, apply transformations using `@tonejs/midi` API
6. **Export:** Write modified JSON back to binary MIDI

**Example Token Savings:**
- Raw MIDI (base64): ~1000 tokens for 8-bar melody
- MIDI JSON: ~200 tokens for same melody
- JSON + metadata: ~250 tokens (but LLM can reason about harmony, not just notes)

### For In-App Playback (Basic Quality)

**Approach:**
```typescript
import { Sampler } from 'smplr';
import { Transport, Part } from 'tone';

// Load instrument (samples hosted remotely)
const piano = new Sampler(audioContext, { instrument: 'piano' });

// Schedule MIDI notes from @tonejs/midi JSON
const part = new Part((time, note) => {
  piano.start({ note: note.midi, velocity: note.velocity, time, duration: note.duration });
}, midiJson.tracks[0].notes);

Transport.start();
```

**Quality level:** Good enough for editing preview, not production audio. Matches project requirement for "basic quality" playback.

### For Conversational Mode

**Stateful conversation without persistence:**
```typescript
// Frontend maintains conversation context in memory
const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
const [currentMidiJson, setCurrentMidiJson] = useState<MidiJSON>(originalMidi);

// Each edit updates currentMidiJson and appends to history
// No database needed for single-session usage
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Tone.js ^14.7.39 | @tonejs/midi ^2.x | Same ecosystem, designed to work together |
| smplr ^0.x | Tone.js ^14.7.39 | smplr uses Tone.js internally for Web Audio |
| webmidi ^3.1.14 | Tone.js ^14.7.39 | Independent APIs, but commonly used together for hardware MIDI input + software playback |
| TypeScript ^5.x | All libraries | All recommended libs have TypeScript definitions |
| Node.js ^20.x LTS | Express ^4.x, OpenAI SDK ^4.x | Standard compatibility |

## Browser Compatibility Warning

**Web MIDI API is NOT supported in Safari** (as of 2025). Apple declined to implement due to fingerprinting concerns.

**Supported browsers:**
- Chrome/Edge (Chromium) - Full support
- Firefox - Full support
- Safari - NO SUPPORT (warn users or provide fallback)

**Mitigation for Safari users:**
- MIDI upload/download still works (File API)
- In-app playback still works (Web Audio API)
- Only hardware MIDI controller input is unavailable

## Deployment Considerations

**Recommended:** Vercel (frontend) + Vercel Serverless Functions (backend)

**Why:**
- Zero-config deployment for Vite apps
- Serverless functions for OpenAI API proxy (no separate backend hosting)
- Environment variable management for API keys
- Free tier sufficient for single-user MVP

**Limitations:**
- No WebSocket support (not needed for single-session usage)
- Cold starts on serverless functions (~1-2s, acceptable for LLM calls that take 5-10s anyway)
- 10-second function timeout (GPT-4o typically responds in 2-5s for MIDI edits)

**Alternative:** Netlify (similar features, slight DX differences)

## Sources

### HIGH Confidence (Official/Verified)
- [Tone.js GitHub Releases](https://github.com/Tonejs/Tone.js/releases) - v14.7.39 verified
- [webmidi GitHub Releases](https://github.com/djipco/webmidi/releases) - v3.1.14 verified
- [OpenSheetMusicDisplay GitHub](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) - v1.9.4 verified
- [smplr GitHub README](https://github.com/danigb/smplr) - Pre-1.0 status and deprecation of soundfont-player verified
- [Web MIDI API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) - Standard specification
- [W3C Web MIDI API Spec](https://www.w3.org/TR/webmidi/) - Published 2025-01-21

### MEDIUM Confidence (Community Consensus)
- [Vite vs Next.js comparison (Strapi 2025)](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) - Framework selection rationale
- [OpenAI API Best Practices](https://www.openassistantgpt.io/blogs/openai-api-integration-best-practices) - Security and optimization patterns
- [Vercel Documentation](https://vercel.com/docs) - Deployment capabilities and limitations

### LOW Confidence (Needs Validation)
- smplr version stability - Pre-1.0 status means API may change before stable release
- Exact token savings ratio - Estimated based on MIDI structure, needs empirical testing with GPT-4o

---

**Stack research for:** Haydn - Natural Language MIDI Editor
**Researched:** 2026-01-23
**Next step:** Validate smplr API stability and measure actual token usage with sample MIDI files
