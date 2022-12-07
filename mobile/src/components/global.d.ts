import '@emotion/react'
import {Theme as DefaultTheme} from '../utils/ThemeProvider/defaultTheme'

declare module '@emotion/react' {
  export interface Theme extends DefaultTheme {}
}
