import {shorthands} from '@tamagui/shorthands'
import type {GenericFont} from 'tamagui'
import {createFont, createTamagui} from 'tamagui'
import {bodyFont, headingFont} from './fonts'
import {darkTheme, lightTheme} from './themes'
import {tokens} from './tokens'

// Legacy per-weight font aliases (old config compat — remove when mobile app is redesigned)
const legacyFont = (family: string): GenericFont =>
  createFont({
    family,
    lineHeight: {},
    letterSpacing: {},
    size: {},
    weight: {},
    face: {},
  })

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
    // Legacy aliases (old config compat — remove when mobile app is redesigned)
    body400: legacyFont('TTSatoshi400'),
    body500: legacyFont('TTSatoshi500'),
    body600: legacyFont('TTSatoshi600'),
    body700: legacyFont('TTSatoshi700'),
  },
  shorthands,
  settings: {
    disableSSR: true,
  },
})

export default config
