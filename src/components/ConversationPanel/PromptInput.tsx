'use client';

import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

/**
 * Text input with submit button for conversation prompts.
 * 500 character limit, Enter to submit.
 */
export function PromptInput({ onSubmit, disabled, isLoading }: PromptInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled || isLoading) return;

    onSubmit(value.trim());
    setValue(''); // Clear input after successful submit
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter (single line input)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = disabled || isLoading;
  const charCount = value.length;
  const maxChars = 500;

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        {/* Text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isDisabled}
          maxLength={maxChars}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={isDisabled || !value.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[100px]"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Character count */}
      <div className="text-xs text-gray-500 text-right">
        {charCount}/{maxChars} characters
      </div>
    </form>
  );
}
