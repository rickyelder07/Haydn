# Phase 6: Natural Language Generation - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate complete MIDI tracks from scratch using natural language text prompts. Users provide descriptions like "create a lo-fi hip hop beat" and receive playable MIDI content. This phase builds on Phase 5's editing capabilities by shifting from modifying existing MIDI to creating new musical content from nothing.

</domain>

<decisions>
## Implementation Decisions

### Generation Scope
- Single prompt can generate full arrangement OR single instrument based on prompt specificity
- If instruments not defined in prompt, default to piano track
- If specific instrument requested, generate only that instrument
- Length selection via dropdown: 8 bar, 16 bar, 32 bar, full song (user-selectable before generation)
- Track limit: Generate normally with up to 4 tracks; above 4 tracks show warning with cost estimate
- When generating into existing project: Offer choice (replace project with confirmation, or add as new tracks)
- Variation mode supported: User can reference existing track/section as template for new generation
- Section-aware generation: Support prompts like "create an 8-bar intro" or "generate a bridge section"
- Ambiguous prompts trigger clarification: Ask user for more detail rather than guessing
- 500-character prompt limit (consistent with Phase 5 editing limit)

### Output Structure
- One instrument per track (drums, bass, melody, etc. each on separate tracks)
- Single drum track combining all drum sounds (kick, snare, hi-hat together)
- Constant tempo (respects BPM from playback tool), dynamic velocity allowed (GPT-4o can vary note velocities)
- Basic metadata: Auto-generate track names like "Lo-fi Drums", "Piano Melody"
- Genre-appropriate note density (trap sparse, orchestral dense, etc.)
- When adding to existing project: Offer choice to match current time signature/key OR use new settings specified in prompt

### Genre Handling
- Expand to 8-10 core genres (classical, jazz, trap, pop, rock, blues, EDM, R&B, country, reggae)
- If genre unclear, ask for clarification
- If genre outside core 8-10, use GPT-4o to interpret freely
- Generated MIDI validated through Phase 4 theory layer, but don't block - warn user if violations detected
- Genre blending supported: GPT-4o can combine characteristics for "jazz-trap fusion", etc.
- Intelligent instrument suggestions: Genre defaults guide GPT-4o (trap → 808 bass), but GPT-4o adapts based on full prompt
- Allow genre mixing across tracks in same project freely
- Broad genre categories (jazz, EDM, rock) rather than sub-genres (bebop, house, metal)
- Optional guidance: Collapsible help section with genre-specific example prompts

### User Control
- Tempo, key, time signature all optional - GPT-4o picks genre-appropriate defaults if not specified
- Preview mode: Generated MIDI plays in preview state, user accepts/rejects/regenerates before committing to project
- 500-character prompt limit for generation requests (matches editing limit from Phase 5)

### Claude's Discretion
- Program number assignment strategy (auto-assign GM defaults vs intelligent GPT-4o mapping)
- Generation format from GPT-4o (raw notes vs musical structures vs hybrid)
- Regeneration UX (simple button vs variation slider vs seed control)
- UI organization (separate generate mode vs unified input vs tabbed interface)

</decisions>

<specifics>
## Specific Ideas

None - user open to standard approaches guided by the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 06-natural-language-generation*
*Context gathered: 2026-02-05*
