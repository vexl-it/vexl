import '@emotion/react'
import {type Theme as DefaultTheme} from '../utils/ThemeProvider/defaultTheme'

declare module '@emotion/react' {
  export interface Theme extends DefaultTheme {
    _: string
  }
}
