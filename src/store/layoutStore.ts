// src/store/layoutStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContainerWidth = 'full' | 'xl';

interface LayoutState {
    // State
    containerWidth: ContainerWidth;

    // Actions
    setContainerWidth: (width: ContainerWidth) => void;
    toggleContainerWidth: () => void;
    reset: () => void;
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set, get) => ({
            // Initial state
            containerWidth: 'xl', // Default to contained layout

            // Actions
            setContainerWidth: (width) => set({ containerWidth: width }),

            toggleContainerWidth: () => {
                const current = get().containerWidth;
                set({ containerWidth: current === 'full' ? 'xl' : 'full' });
            },

            reset: () => set({ containerWidth: 'xl' }),
        }),
        {
            name: 'layout-preferences', // localStorage key
            partialize: (state) => ({
                // Persist only containerWidth
                containerWidth: state.containerWidth,
            }),
        }
    )
);