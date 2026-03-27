import React, {createContext, useContext, type ReactNode} from 'react'
import {TamaguiProvider} from 'tamagui'
import {config} from '../config/tamagui.config'
import {useThemeMode, type ThemeMode} from './useThemeMode'

interface VexlThemeContextValue {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const VexlThemeContext = createContext<VexlThemeContextValue | null>(null)

interface VexlThemeProviderProps {
  children: ReactNode
  defaultMode?: ThemeMode
}

export function VexlThemeProvider({
  children,
  defaultMode = 'system',
}: VexlThemeProviderProps): React.JSX.Element {
  const themeMode = useThemeMode(defaultMode)

  return (
    <VexlThemeContext.Provider value={themeMode}>
      <TamaguiProvider config={config} defaultTheme={themeMode.resolvedTheme}>
        {children}
      </TamaguiProvider>
    </VexlThemeContext.Provider>
  )
}

export function useVexlTheme(): VexlThemeContextValue {
  const ctx = useContext(VexlThemeContext)
  if (!ctx) {
    throw new Error('useVexlTheme must be used within a VexlThemeProvider')
  }
  return ctx
}
