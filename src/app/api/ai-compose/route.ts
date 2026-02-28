import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic/client';
import { pickSeeds } from '@/lib/scaffold/seeds';
import { resolveAllSections } from '@/lib/scaffold/resolveProgression';
import { assembleFromScaffold } from '@/lib/scaffold/assembleFromScaffold';
import type { MusicSpec, DisplayOutput, DisplaySection } from '@/lib/scaffold/types';

/**
 * POST /api/ai-compose
 *
 * Scaffold-based AI composition: single Claude call → MusicSpec JSON
 * → Tonal.js resolution → assembleFromScaffold() → HaydnProject.
 *
 * Body: { prompt: string, barCount?: number }
 * Response: { type: 'scaffold', data: { project, displayOutput }, usage }
 */

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(stylisticSeeds: string[], barCount: number): string {
  return `You are a professional music composer and arranger. Your task is to generate a complete harmonic scaffold for a MIDI composition as structured JSON.

## Your Role
You produce a HIGH-LEVEL musical blueprint — key, mode, tempo, song sections with Roman numeral chord progressions, and rationale. You do NOT write individual MIDI notes. The system's code handles note generation from your blueprint.

## Output Format
Return ONLY a valid JSON object matching this exact schema (no markdown, no explanation):

{
  "key": "C",                          // Root note: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B
  "mode": "minor",                      // major | minor | dorian | mixolydian | harmonic minor
  "tempo_bpm": 90,                      // Integer 40–240
  "time_signature": "4/4",             // Always "4/4" for now
  "feel": "melancholic late-night jazz", // Free-form descriptive string
  "stylistic_seeds": ["walking bass", "tritone substitution"], // Subset of provided seeds you used
  "tension_arc": "Builds from sparse intro through mounting verse tension, peaks at chorus, releases to reflective outro",
  "genre_hint": "jazz",                // lofi | trap | boom-bap | jazz | classical | pop
  "sections": [
    {
      "name": "Intro",
      "bars": 4,
      "role": "intro",                 // intro | verse | chorus | bridge | outro
      "progression": ["i", "VI", "III", "VII"], // Roman numerals, 1 per bar (cycle if section.bars > progression.length)
      "rhythm_density": 0.4,           // 0.0 (sparse) to 1.0 (dense)
      "rationale": "Opens with a restrained i–VI–III–VII to establish key without revealing full energy"
    }
  ]
}

## Bar Count Requirement (CRITICAL)
Target total bars: **${barCount}**
The sum of all section.bars MUST equal exactly ${barCount}.
Distribute bars naturally across sections (intro: 2–4, verse: 4–8, chorus: 4–8, bridge: 4, outro: 2–4).

## Roman Numeral Rules
- Use standard uppercase for major chords: I, II, III, IV, V, VI, VII
- Use lowercase for minor chords: i, ii, iii, iv, v, vi, vii
- Add quality modifiers: maj7, 7, m7, °, °7, ø7 (e.g., "Imaj7", "V7", "ii°")
- Secondary dominants: V/V, V7/IV, viio7/vi (slash notation)
- Borrowed chords: bVII, bVI, bIII (flat prefix)
- Each progression array entry = 1 bar; cycle if section has more bars than progression entries
- Minimum 2 different chords per section

## Stylistic Seeds (inject harmonic interest using some of these)
The following seeds were randomly selected for this composition:
${stylisticSeeds.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

Use at least 1–2 of these seeds somewhere in the piece. Note which seeds you used in the stylistic_seeds field.

## Composition Guidelines
- Key should fit the mood (minor for dark/melancholic, major for bright/uplifting, dorian for funky/modal)
- Tempo: lofi 70–90, jazz 100–160, pop 110–130, trap 130–160, boom-bap 85–95, classical 60–120
- Avoid generic I–IV–V–I everywhere; create harmonic interest and motion
- Tension arc should be reflected in the chord choices (denser/more dissonant in climax sections)
- Each section's rationale should explain the harmonic logic concisely (1–2 sentences)`;
}

// ---------------------------------------------------------------------------
// Main POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, barCount = 8 } = body as { prompt?: unknown; barCount?: number };

  if (!prompt || typeof prompt !== 'string' || prompt.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
  }

  if (prompt.length > 500) {
    return NextResponse.json({ error: 'Prompt exceeds 500 character limit' }, { status: 400 });
  }

  const targetBars = Math.max(4, Math.min(32, Number(barCount) || 8));
  const seeds = pickSeeds(3);

  try {
    // --- 1. Call Claude to generate MusicSpec ---
    const systemPrompt = buildSystemPrompt(seeds, targetBars);
    const userMessage = `Compose: ${prompt}\n\nTarget length: ${targetBars} bars total.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      temperature: 1.0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Extract JSON from response (handle potential markdown code fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ai-compose] No JSON found in Claude response:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: 'Claude did not return valid JSON', rawText: rawText.slice(0, 200) },
        { status: 500 }
      );
    }

    let spec: MusicSpec;
    try {
      spec = JSON.parse(jsonMatch[0]) as MusicSpec;
    } catch (parseErr) {
      console.error('[ai-compose] JSON parse error:', parseErr);
      return NextResponse.json(
        { error: 'Failed to parse MusicSpec JSON', detail: String(parseErr) },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!spec.key || !spec.mode || !spec.tempo_bpm || !Array.isArray(spec.sections) || spec.sections.length === 0) {
      console.error('[ai-compose] Invalid MusicSpec structure:', JSON.stringify(spec).slice(0, 300));
      return NextResponse.json(
        { error: 'MusicSpec missing required fields (key, mode, tempo_bpm, sections)' },
        { status: 500 }
      );
    }

    // --- 2. Resolve progressions via Tonal.js ---
    const resolvedSections = resolveAllSections(spec.sections, spec.key, spec.mode);

    // --- 3. Assemble HaydnProject ---
    const project = assembleFromScaffold(spec, resolvedSections);

    // --- 4. Build DisplayOutput ---
    const displaySections: DisplaySection[] = resolvedSections.map((rs, i) => {
      const specSection = spec.sections[i];
      return {
        name: rs.name,
        role: rs.role,
        bars: rs.bars,
        progressionRoman: specSection?.progression ?? [],
        progressionNamed: rs.chords.map(c => c.chordName),
        rationale: rs.rationale,
      };
    });

    const displayOutput: DisplayOutput = {
      title: `${spec.feel} — ${spec.key} ${spec.mode}`,
      key: `${spec.key} ${spec.mode}`,
      tempo: spec.tempo_bpm,
      feel: spec.feel,
      tensionArc: spec.tension_arc,
      stylisticSeedsUsed: spec.stylistic_seeds ?? seeds,
      sections: displaySections,
    };

    // --- 5. Token usage ---
    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    return NextResponse.json({
      type: 'scaffold',
      data: { project, displayOutput },
      usage,
    });
  } catch (error) {
    console.error('[ai-compose] Scaffold generation failed:', error);
    return NextResponse.json(
      { error: 'Scaffold generation failed', message: String(error) },
      { status: 500 }
    );
  }
}
