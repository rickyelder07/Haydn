'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/state/uiStore';
import { ResizeHandle } from './ResizeHandle';

interface SidebarProps {
  children: React.ReactNode;
}

// Chevron left icon
function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

// Chevron right icon
function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Sidebar({ children }: SidebarProps) {
  const { sidebarWidth, sidebarCollapsed, setSidebarWidth, toggleSidebar } = useUIStore();

  const handleResize = useCallback(
    (deltaX: number) => {
      setSidebarWidth(sidebarWidth + deltaX);
    },
    [sidebarWidth, setSidebarWidth]
  );

  const currentWidth = sidebarCollapsed ? 48 : sidebarWidth;

  return (
    <aside
      style={{
        width: currentWidth,
        minWidth: currentWidth,
        transition: 'width 200ms ease, min-width 200ms ease',
      }}
      className="relative flex flex-col h-full glass-panel border-r border-white/10 overflow-hidden shrink-0"
    >
      {/* Sidebar Header with collapse toggle */}
      <div className="flex items-center justify-end px-2 py-3 border-b border-white/5">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Sidebar Content */}
      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6">
          {children}
        </div>
      )}

      {/* Resize Handle - only shown when expanded */}
      {!sidebarCollapsed && <ResizeHandle onResize={handleResize} />}
    </aside>
  );
}
