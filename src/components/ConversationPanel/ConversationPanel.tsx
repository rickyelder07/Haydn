'use client';

import { useState } from 'react';
import { useConversationStore } from '@/state/conversationStore';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { MessageList } from './MessageList';
import { PromptInput } from './PromptInput';
import { buildMIDIContext } from '@/lib/nl-edit/contextBuilder';
import { executeEditOperations } from '@/lib/nl-edit/editExecutor';
import { buildMessagesFromTurns } from '@/lib/nl-conversation/messageBuilder';
import type {
  ConversationTurn,
  TokenUsage,
  ExecutionResult,
} from '@/lib/nl-conversation/types';
import type { EditResponse } from '@/lib/openai/schemas';

/**
 * Main container for multi-turn conversation UI.
 * Integrates message history, input, and controls.
 */
export function ConversationPanel() {
  const {
    activeSession,
    isLoading,
    error,
    startNewSession,
    clearSession,
    addTurn,
    setLoading,
    setError,
    getTotalCost,
  } = useConversationStore();

  /**
   * Handle new prompt submission.
   * Orchestrates: API call → edit execution → store update.
   */
  const handleSubmit = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build MIDI context from current project/track state
      const context = buildMIDIContext();

      // Build conversation history from previous turns
      const conversationHistory = activeSession
        ? buildMessagesFromTurns(activeSession.turns)
        : [];

      // Call /api/nl-conversation
      const response = await fetch('/api/nl-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          conversationHistory,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      const assistantResponse: EditResponse = data.result;
      const usage: { promptTokens: number; completionTokens: number; totalTokens: number } =
        data.usage;

      // Handle track targeting: switch to target track if specified
      if (assistantResponse.targetTrack) {
        const { project } = useProjectStore.getState();
        const { selectTrack } = useEditStore.getState();

        if (project) {
          // Find track by name (case-insensitive match)
          const targetName = assistantResponse.targetTrack.toLowerCase();
          const trackIndex = project.tracks.findIndex(
            (track) => track.name.toLowerCase().includes(targetName)
          );

          if (trackIndex !== -1) {
            // Switch to target track
            selectTrack(trackIndex);
            console.log(
              `[Conversation] Switched to track: ${project.tracks[trackIndex].name}`
            );
          } else {
            console.warn(
              `[Conversation] Target track "${assistantResponse.targetTrack}" not found. Using currently selected track.`
            );
          }
        }
      }

      // Execute edit operations
      const executionResult = executeEditOperations(assistantResponse.operations);

      // Calculate token cost ($2.50/M input, $10/M output)
      const inputCost = (usage.promptTokens / 1_000_000) * 2.5;
      const outputCost = (usage.completionTokens / 1_000_000) * 10;
      const estimatedCost = inputCost + outputCost;

      const tokenUsage: TokenUsage = {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCost,
      };

      // Create conversation turn
      const turn: ConversationTurn = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        userPrompt: prompt,
        assistantResponse,
        executionResult,
        tokenUsage,
      };

      // Add turn to store
      addTurn(turn);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "New" button click.
   * Confirms if current session has turns.
   */
  const handleNewSession = () => {
    if (activeSession && activeSession.turns.length > 0) {
      const confirmed = window.confirm(
        'Start a new conversation? Current conversation will be lost.'
      );
      if (!confirmed) return;
    }
    startNewSession();
  };

  /**
   * Handle "Clear" button click.
   */
  const handleClearSession = () => {
    if (activeSession && activeSession.turns.length > 0) {
      const confirmed = window.confirm(
        'Clear conversation? This cannot be undone.'
      );
      if (!confirmed) return;
    }
    clearSession();
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded-lg bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeSession ? activeSession.title : 'No Active Conversation'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium"
            >
              New
            </button>
            <button
              onClick={handleClearSession}
              disabled={!activeSession}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Cost: ${getTotalCost().toFixed(4)}
        </div>
      </div>

      {/* Body */}
      {!activeSession ? (
        // Empty state
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No active conversation</p>
            <button
              onClick={startNewSession}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Conversation
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Message list */}
          <MessageList turns={activeSession.turns} isLoading={isLoading} />

          {/* Error banner */}
          {error && (
            <div className="border-t border-gray-200 p-3 bg-red-50 border-red-200 text-red-700 text-sm">
              <strong className="font-medium">Error:</strong> {error}
            </div>
          )}

          {/* Input section */}
          <PromptInput
            onSubmit={handleSubmit}
            disabled={!activeSession}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
