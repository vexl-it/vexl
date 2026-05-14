import {VexlThemeProvider} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {appThemeModeAtom} from '../preferences'

function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const appThemeMode = useAtomValue(appThemeModeAtom)

  return (
    <VexlThemeProvider defaultMode={appThemeMode}>{children}</VexlThemeProvider>
  )
}

export default ThemeProvider
