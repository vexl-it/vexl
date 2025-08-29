import React from 'react'
import {TamaguiProvider} from 'tamagui'
import config from './tamagui.config'

function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <TamaguiProvider config={config}>{children}</TamaguiProvider>
}

export default ThemeProvider
