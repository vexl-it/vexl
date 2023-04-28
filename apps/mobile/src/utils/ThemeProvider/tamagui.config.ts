import {createFont, createTamagui, createTokens} from 'tamagui'
import {createAnimations} from '@tamagui/animations-reanimated'
import {shorthands} from '@tamagui/shorthands'

const color = {
  backgroundBlack: '#101010',
  backgroundWhite: '#FFFFFF',
  lightColorText: '#FFFFFF',
  darkColorText: '#000000',
  main: '#FCCD6C',
  white: '#FFFFFF',
  green: '#ACD9B7',
  grey: '#262626',
  greyAccent1: '#4C4C4C',
  greyAccent2: '#848484',
  greyAccent3: '#DDDDDD',
  greyAccent4: '#E9E9E9',
  greyAccent5: '#f2f2f2',
  redAccent1: '#351614',
  red: '#EE675E',
  darkRed: '#351614',
  darkBrown: '#322717',
  black: '#000000',
  blackAccent1: '#131313',
  greyOnBlack: '#AFAFAF',
  greyOnWhite: '#808080',
  pinkAccent1: '#322930',
  pinkAccent2: '#4C3B49',
  pink: '#fcc5f3',
  pastelGreen: '#ACD9B7',
}

const space = {
  '-4': -16,
  '-3': -12,
  '-2': -8,
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  true: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 54,
}

const zIndex = {
  '-1': -1,
  1: 100,
  5: 500,
  10: 1000,
  100: 10000,
}

const radius = {
  1: 4,
  2: 6,
  3: 8,
  4: 10,
  5: 12,
  true: 12,
  6: 16,
  7: 20,
  8: 24,
  9: 28,
  10: 32,
  11: 36,
}

const bodyFont400 = createFont({
  family: 'TTSatoshi400',
  lineHeight: {},
  letterSpacing: {},
  size: {},
  weight: {},
  face: {},
})

const bodyFont500 = createFont({
  family: 'TTSatoshi500',
  lineHeight: {},
  letterSpacing: {},
  size: {},
  weight: {},
  face: {},
})

const bodyFont600 = createFont({
  family: 'TTSatoshi600',
  lineHeight: {},
  letterSpacing: {},
  color: {},
  size: {},
  weight: {},
  face: {},
})

const bodyFont700 = createFont({
  family: 'TTSatoshi700',
  lineHeight: {},
  letterSpacing: {},
  size: {},
  weight: {},
  face: {},
})

const headingFont = createFont({
  family: 'PPMonument',
  lineHeight: {},
  letterSpacing: {},
  size: {},
  weight: {},
  face: {},
})

const size = {
  0: 0,
  1: 5,
  2: 10,
  true: 10,
}

// animation types not working properly
const animations: any = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
})

export const tokens = createTokens({
  space,
  color,
  size,
  radius,
  zIndex,
})

const appConfig = createTamagui({
  animations,
  fonts: {
    heading: headingFont,
    body: bodyFont400,
    body500: bodyFont500,
    body600: bodyFont600,
    body700: bodyFont700,
  },
  themes: {
    vexl: {
      background: tokens.color.main,
      color: tokens.color.lightColorText,
    },
  },
  tokens,
  shorthands,
})

export type AppConfig = typeof appConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}
export default appConfig
