import {useCallback, useMemo, useState} from 'react'
import {useColorScheme} from 'react-native'

export type ThemeMode = 'light' | 'dark' | 'system'

interface UseThemeModeReturn {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

export function useThemeMode(
  initialMode: ThemeMode = 'system'
): UseThemeModeReturn {
  const systemColorScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  const resolvedTheme = useMemo(
    () =>
      mode === 'system'
        ? systemColorScheme === 'dark'
          ? 'dark'
          : 'light'
        : mode,
    [mode, systemColorScheme]
  )

  const toggle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'system') return resolvedTheme === 'light' ? 'dark' : 'light'
      return prev === 'light' ? 'dark' : 'light'
    })
  }, [resolvedTheme])

  return {mode, resolvedTheme, setMode, toggle}
}
