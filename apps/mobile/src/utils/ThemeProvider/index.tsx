import {VexlThemeProvider} from '@vexl-next/ui'
import React from 'react'

function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <VexlThemeProvider defaultMode="system">{children}</VexlThemeProvider>
}

export default ThemeProvider
