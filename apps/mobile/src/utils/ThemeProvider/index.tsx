import React from 'react'
import {TamaguiProvider} from 'tamagui'

import config from '../../../tamagui.config'

function ThemeProvider({children}: {children: React.ReactNode}): JSX.Element {
  return <TamaguiProvider config={config}>{children}</TamaguiProvider>
}

export default ThemeProvider
