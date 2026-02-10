'use client';

import { useEffect, useRef } from 'react';
import type { ConversationTurn } from '@/lib/nl-conversation/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  turns: ConversationTurn[];
  isLoading: boolean;
}

/**
 * Scrollable list of conversation turns.
 * Auto-scrolls to bottom on new messages.
 */
export function MessageList({ turns, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Empty state */}
      {turns.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 mt-8">
          <p className="text-sm">No messages yet. Start a conversation!</p>
        </div>
      )}

      {/* Message list */}
      {turns.map((turn, index) => (
        <MessageItem
          key={turn.id}
          turn={turn}
          isLatest={index === turns.length - 1}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                ●
              </span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>
                ●
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
