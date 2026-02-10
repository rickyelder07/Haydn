import type { ConversationTurn } from './types';
import type { MIDIContext } from '@/app/api/nl-edit/route';
import type { EditResponse } from '@/lib/openai/schemas';

/**
 * Build OpenAI messages array from conversation history.
 *
 * Converts conversation turns into OpenAI's message format for context preservation.
 * Each turn adds a user message (prompt) followed by an assistant message (response).
 *
 * Does NOT include the system prompt - that's added separately.
 *
 * @param turns - Array of conversation turns in chronological order
 * @returns Array of OpenAI messages (user/assistant pairs)
 */
export function buildMessagesFromTurns(
  turns: ConversationTurn[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const turn of turns) {
    // Add user message
    messages.push({
      role: 'user',
      content: turn.userPrompt,
    });

    // Add assistant message (stringify the structured response)
    messages.push({
      role: 'assistant',
      content: JSON.stringify(turn.assistantResponse),
    });
  }

  return messages;
}

/**
 * Build system prompt for conversational editing mode.
 *
 * Extends the single-shot system prompt with additional instructions for
 * multi-turn conversations, including pronoun resolution and context handling.
 *
 * @param context - MIDI context with project, track, and validation state
 * @returns Complete system prompt string with conversation-specific instructions
 */
export function buildSystemPromptForConversation(
  context: MIDIContext
): string {
  const { currentTrack, otherTracks, project, theoryValidation } = context;

  let prompt = `You are a MIDI editing assistant. The user will describe edits to make to their MIDI track. Your job is to output structured edit operations.

## Project Context

- **Tempo:** ${project.tempo} BPM
- **Time Signature:** ${project.timeSignatureNumerator}/${project.timeSignatureDenominator}
- **PPQ (Pulses Per Quarter Note):** ${project.ppq} ticks
${project.keySignature ? `- **Key Signature:** ${project.keySignature.key} ${project.keySignature.scale}` : ''}

## Current Track

**Name:** ${currentTrack.name}
**Instrument:** ${currentTrack.instrumentName} (Program ${currentTrack.instrumentNumber})
**Channel:** ${currentTrack.channel}
**Note Count:** ${currentTrack.notes.length}

**Notes (in chronological order):**
\`\`\`json
${JSON.stringify(currentTrack.notes, null, 2)}
\`\`\`

## Other Tracks (for context)

${otherTracks.map((t) => `- **${t.name}** (${t.instrumentName}): ${t.noteCount} notes, range MIDI ${t.lowestNote}-${t.highestNote}`).join('\n')}
`;

  // Add theory validation context if enabled
  if (theoryValidation?.enabled) {
    prompt += `\n## Music Theory Validation

- **Validation Enabled:** Yes
- **Genre Constraint:** ${theoryValidation.genre}
${theoryValidation.currentScale ? `- **Current Scale:** ${theoryValidation.currentScale}` : ''}
${theoryValidation.recentErrors && theoryValidation.recentErrors.length > 0 ? `\n**Recent Validation Errors:**\n${theoryValidation.recentErrors.map((e) => `- ${e.message}`).join('\n')}` : ''}

⚠️ **Important:** Any notes you add or modify MUST conform to the current scale and genre rules. If the edit would violate theory rules, warn the user in the warnings array.
`;
  }

  // Add conversation-specific instructions
  prompt += `\n## Conversation Context

This is a multi-turn conversation. Previous messages show what the user requested and what edits were made.
- Resolve pronouns ("it", "them", "the melody") based on conversation context
- If user says "undo that" or "revert", warn that undo should use the undo button, not conversation
- Reference previous changes when explaining new edits

## Multi-Track Targeting

The current context includes ONE track with full note data (currentTrack) and summaries of OTHER tracks.
- If user mentions a DIFFERENT track than currentTrack (e.g., "modify the bass" when drums are active), set **targetTrack** to that track's name
- The system will switch to that track before applying your edits
- If user doesn't specify a track, or mentions the current track, leave **targetTrack** null
- Track names are shown in otherTracks array and currentTrack.name
- Match the exact track name from the lists above (case-insensitive match is OK)

**Example:**
- User: "make the bass louder" (currentTrack is "Drums Track")
  → targetTrack: "Bass Track" (match name from otherTracks)
- User: "add more hi-hats" (currentTrack is "Drums Track")
  → targetTrack: null (modifying current track)

## Instructions

1. **Time is in TICKS, not measures.** Use the PPQ value to calculate tick positions.
2. **MIDI numbers** are 0-127 (C4 = 60, A4 = 69).
3. **Velocity** is 0-1 (0 = silent, 1 = maximum).
4. **Preserve musical coherence.** Consider the existing notes and other tracks.
5. **Output structured edit operations** using the provided schema.
6. **Be conservative.** If the request is ambiguous, make minimal changes and explain in warnings.
${theoryValidation?.enabled ? '7. **Validate theory conformance.** Warn if edits would violate scale or genre rules.' : ''}

## Available Operations

- **add_notes:** Add new notes to the track
- **remove_notes:** Remove notes by index (array position in notes array)
- **modify_notes:** Update existing note properties (midi, ticks, durationTicks, velocity)
- **transpose:** Shift notes by semitones (optionally within tick range)
- **change_tempo:** Update project tempo (affects all tracks)
- **change_key:** Update project key signature (affects all tracks)
`;

  return prompt;
}
