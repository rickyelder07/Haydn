'use client';

import type { ConversationTurn } from '@/lib/nl-conversation/types';

interface MessageItemProps {
  turn: ConversationTurn;
  isLatest: boolean;
}

/**
 * Individual message bubble for user prompt and assistant response.
 * Shows user message on right (blue), assistant response on left (gray).
 */
export function MessageItem({ turn, isLatest }: MessageItemProps) {
  const timestamp = new Date(turn.timestamp).toLocaleTimeString();
  const { success, errors } = turn.executionResult;
  const { totalTokens, estimatedCost } = turn.tokenUsage;
  const warnings = turn.assistantResponse.warnings || [];

  return (
    <div className="space-y-2">
      {/* User message bubble (right-aligned) */}
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-500 text-white rounded-lg p-3">
          <div className="text-sm">{turn.userPrompt}</div>
          <div className="text-xs text-blue-100 mt-1">{timestamp}</div>
        </div>
      </div>

      {/* Assistant response bubble (left-aligned) */}
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-gray-100 rounded-lg p-3">
          {/* Success/failure indicator */}
          <div className="flex items-center gap-2 mb-2">
            {success ? (
              <span className="text-green-600 font-medium text-sm">✓</span>
            ) : (
              <span className="text-red-600 font-medium text-sm">✗</span>
            )}
            <span className="text-sm font-medium text-gray-900">
              {turn.assistantResponse.summary}
            </span>
          </div>

          {/* Warnings (if any) */}
          {warnings.length > 0 && (
            <div className="mb-2">
              {warnings.map((warning, i) => (
                <div key={i} className="text-sm text-orange-600">
                  ⚠ {warning}
                </div>
              ))}
            </div>
          )}

          {/* Errors (if execution failed) */}
          {!success && errors.length > 0 && (
            <div className="mb-2">
              {errors.map((error, i) => (
                <div key={i} className="text-sm text-red-600">
                  • {error}
                </div>
              ))}
            </div>
          )}

          {/* Token usage and cost */}
          <div className="text-xs text-gray-500 mt-2">
            {totalTokens} tokens (~${estimatedCost.toFixed(4)})
          </div>
        </div>
      </div>
    </div>
  );
}
