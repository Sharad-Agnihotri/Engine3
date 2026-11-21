"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  toggleSidebar: () => void;
  setInspectorOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      inspectorOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
    }),
    { name: "vis:ui" },
  ),
);
