---
status: diagnosed
phase: 10-synthesis-enhancement
source: 10-01-SUMMARY.md, 10-02-SUMMARY.md
started: 2026-02-27T00:00:00Z
updated: 2026-02-27T00:00:00Z
---

## Current Test

## Current Test

[testing complete]

## Tests

### 1. Real Instrument Sounds
expected: Import a MIDI file and press Play. Instruments sound like real recorded samples (piano = real piano, strings = real strings, etc.), not the buzzy PolySynth tone from before.
result: pass

### 2. Audio Quality Improvement
expected: Subjective check — the audio quality feels noticeably better than before. Good enough to compose with.
result: pass

### 3. Percussion Still Works
expected: If the MIDI has a drum/percussion track (channel 10 / GM channel 9), drums still play correctly with rhythmic percussive sounds. Drums are NOT replaced with a piano or string sample.
result: pass

### 4. Multi-Instrument Parallel Loading
expected: For a MIDI with several different instruments (e.g. piano + bass + strings), all instruments load simultaneously rather than one at a time. No long sequential wait between instruments becoming available.
result: pass

### 5. Loading State During Sample Fetch
expected: While CDN samples are being fetched, there is a visible loading indicator. The play button activates (or audio is ready) once samples have loaded.
result: issue
reported: "there is no indicator or loading bar for loading samples. but they do load extremely quickly, I don't even notice if there is an opportunity to show a loading bar."
severity: minor

### 6. CDN Fallback Graceful Degradation
expected: If CDN samples fail to load (or you simulate this by going offline), playback still works — falls back to synthesized sound rather than breaking entirely.
result: skipped
reason: Browser HTTP cache served CDN samples while offline — rm -rf .next only clears Next.js build cache, not browser cache. App did not break offline. True fallback (SynthInstrument) untestable without clearing browser cache + going offline simultaneously.

## Summary

total: 6
passed: 4
issues: 1
pending: 0
skipped: 1

## Gaps

- truth: "Loading indicator is visible while CDN samples are being fetched"
  status: failed
  reason: "User reported: there is no indicator or loading bar for loading samples. but they do load extremely quickly, I don't even notice if there is an opportunity to show a loading bar."
  severity: minor
  test: 5
  root_cause: "playbackStore.isLoading is correctly tracked during CDN fetch, but no visible UI was built. TransportStrip.tsx has a 14x14px spinner (line 71) and the play button goes disabled:opacity-40 — both too subtle to notice. No indicator exists in page.tsx during the loading window. Gap is real on cold load (fresh tab, no browser cache) where CDN fetches for each unique GM program can take 1-3s on slower connections."
  artifacts:
    - path: "src/components/TimelineRuler/TransportStrip.tsx"
      issue: "Existing spinner is 14x14px and barely visible; no text label; disabled play button at 40% opacity is too subtle"
    - path: "src/app/page.tsx"
      issue: "No loading feedback during loadProject() — UI silently switches to piano roll while samples fetch in background"
  missing:
    - "Add 'Loading samples...' text label next to spinner in TransportStrip.tsx during isLoading"
    - "Optionally surface isLoading state in header status badge (page.tsx)"
