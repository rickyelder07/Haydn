import { create } from 'zustand';
import type {
  ConversationSession,
  ConversationTurn,
} from '@/lib/nl-conversation/types';

/**
 * Conversation state
 */
interface ConversationState {
  activeSession: ConversationSession | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Conversation actions
 */
interface ConversationActions {
  startNewSession: () => void;
  clearSession: () => void;
  addTurn: (turn: ConversationTurn) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getTotalTokens: () => number;
  getTotalCost: () => number;
}

/**
 * Conversation store manages multi-turn conversation state.
 * NO persist middleware - session-only state per research recommendation.
 */
export const useConversationStore = create<
  ConversationState & ConversationActions
>((set, get) => ({
  // Initial state
  activeSession: null,
  isLoading: false,
  error: null,

  /**
   * Start a new conversation session.
   * Creates session with UUID, timestamp, empty turns, placeholder title.
   */
  startNewSession: () => {
    const session: ConversationSession = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      turns: [],
      title: 'New Conversation',
    };
    set({ activeSession: session, error: null });
  },

  /**
   * Clear the active session.
   * Resets to null and clears any error state.
   */
  clearSession: () => {
    set({ activeSession: null, error: null });
  },

  /**
   * Add a turn to the active session.
   * Updates lastUpdatedAt and sets title from first prompt if needed.
   */
  addTurn: (turn: ConversationTurn) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const updatedTurns = [...activeSession.turns, turn];
    const isFirstTurn = activeSession.turns.length === 0;

    // Generate title from first prompt (truncate to 50 chars)
    const title = isFirstTurn
      ? turn.userPrompt.length > 50
        ? turn.userPrompt.slice(0, 50) + '...'
        : turn.userPrompt
      : activeSession.title;

    set({
      activeSession: {
        ...activeSession,
        turns: updatedTurns,
        lastUpdatedAt: Date.now(),
        title,
      },
    });
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Set or clear error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Get total tokens used across all turns in active session.
   */
  getTotalTokens: () => {
    const { activeSession } = get();
    if (!activeSession) return 0;

    return activeSession.turns.reduce(
      (sum, turn) => sum + turn.tokenUsage.totalTokens,
      0
    );
  },

  /**
   * Get total estimated cost across all turns in active session.
   */
  getTotalCost: () => {
    const { activeSession } = get();
    if (!activeSession) return 0;

    return activeSession.turns.reduce(
      (sum, turn) => sum + turn.tokenUsage.estimatedCost,
      0
    );
  },
}));
