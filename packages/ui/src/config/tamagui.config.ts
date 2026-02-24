import {shorthands} from '@tamagui/shorthands'
import {createTamagui} from 'tamagui'
import {bodyFont, headingFont} from './fonts'
import {darkTheme, lightTheme} from './themes'
import {tokens} from './tokens'

export const config = createTamagui({
  defaultFont: 'body',
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  shorthands,
  settings: {
    disableSSR: true,
  },
})

export default config
