import React from 'react'
import {ThemeProvider as EmotionThemeProvider} from '@emotion/react'
import defaultTheme from './defaultTheme'

function ThemeProvider({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <EmotionThemeProvider theme={defaultTheme}>{children}</EmotionThemeProvider>
  )
}

export default ThemeProvider
