'use client';

type EditMode = 'single-shot' | 'conversation';

interface EditModeToggleProps {
  mode: EditMode;
  onChange: (mode: EditMode) => void;
}

// Lightning bolt SVG for Quick Edit
const LightningIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
  </svg>
);

// Chat bubble SVG for Conversation
const ChatBubbleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

/**
 * Toggle component for switching between editing modes.
 * Two-button segment control design.
 */
export function EditModeToggle({ mode, onChange }: EditModeToggleProps) {
  return (
    <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
      {/* Quick Edit (single-shot) button */}
      <button
        type="button"
        onClick={() => onChange('single-shot')}
        className={`
          flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
          ${
            mode === 'single-shot'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        title="One-off edits without context"
      >
        <LightningIcon />
        Quick Edit
      </button>

      {/* Conversation mode button */}
      <button
        type="button"
        onClick={() => onChange('conversation')}
        className={`
          flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300
          ${
            mode === 'conversation'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        title="Multi-turn edits with memory"
      >
        <ChatBubbleIcon />
        Conversation
      </button>
    </div>
  );
}
