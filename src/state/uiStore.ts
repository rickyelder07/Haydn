import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;

interface UIState {
  // State
  sidebarWidth: number;
  sidebarCollapsed: boolean;

  // Actions
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarWidth: 280,
      sidebarCollapsed: false,

      setSidebarWidth: (width) =>
        set({
          sidebarWidth: Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width)),
        }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'haydn-ui-state',
    }
  )
);
