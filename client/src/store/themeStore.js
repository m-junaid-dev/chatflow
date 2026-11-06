import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,

      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark
          if (next) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { isDark: next }
        }),

      setTheme: (isDark) => {
        if (isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ isDark })
      },

      initTheme: () => {
        const stored = localStorage.getItem('theme-storage')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed?.state?.isDark) {
              document.documentElement.classList.add('dark')
            }
          } catch {
            // ignore
          }
        }
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme class on rehydration
        if (state?.isDark) {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)
