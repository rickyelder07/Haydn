'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit',
  className = '',
  inputClassName = '',
  maxLength,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when external value changes (while not editing)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  // Auto-focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const enterEditMode = useCallback(() => {
    setLocalValue(value);
    setIsEditing(true);
  }, [value]);

  const save = useCallback(() => {
    const trimmed = localValue.trim();
    if (trimmed === '') {
      // Revert to original value on empty input
      setLocalValue(value);
    } else {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [localValue, value, onSave]);

  const cancel = useCallback(() => {
    setLocalValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel]
  );

  const handleBlur = useCallback(() => {
    save();
  }, [save]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`
          bg-white/10 border border-cyan-500/50 rounded px-1 py-0.5
          text-primary outline-none focus:border-cyan-400/80
          transition-colors min-w-0 w-full
          ${inputClassName}
        `}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      onDoubleClick={enterEditMode}
      title="Double-click to edit"
      className={`
        cursor-text hover:opacity-80 transition-opacity
        ${className}
      `}
    >
      {value || placeholder}
    </span>
  );
}
