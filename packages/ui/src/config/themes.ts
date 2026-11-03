import {colors} from './tokens'

// Theme tokens from Figma — Vexl redesign DEV (node 593:39715)
// Both themes share an identical set of keys

export const lightTheme = {
  // Accents
  accentHighlightPrimary: colors.black100,
  accentHighlightSecondary: colors.gold100,
  accentYellowPrimary: colors.yellow100,
  accentYellowSecondary: colors.yellow50,

  // Background
  backgroundHighlight: '#D6D4DB',
  backgroundOnBar: colors.white100,
  backgroundPrimary: colors.white100,
  backgroundSecondary: '#F6F5F8',
  backgroundTertiary: '#EFEDF3',
  navigationBackground: '#F5F3ED',
  navigationBackgroundHighlight: colors.yellow50,

  // Foreground
  foregroundPrimary: colors.black100,
  foregroundSecondary: '#666666',
  foregroundTertiary: '#999999',

  // Other
  gradientHelper: '#FFFFFF00',

  // Vibrant
  greenBackground: colors.greenLight,
  greenForeground: colors.greenDark,
  pinkBackground: colors.pinkLight,
  pinkForeground: colors.pinkDark,
  redBackground: colors.redLight,
  redForeground: colors.redDark,
}

export const darkTheme: Record<keyof typeof lightTheme, string> = {
  // Accents
  accentHighlightPrimary: colors.yellow100,
  accentHighlightSecondary: colors.yellow100,
  accentYellowPrimary: colors.yellow100,
  accentYellowSecondary: colors.yellowDark,

  // Background
  backgroundHighlight: '#6F6F6F',
  backgroundOnBar: '#363636',
  backgroundPrimary: colors.black100,
  backgroundSecondary: '#262626',
  backgroundTertiary: '#363636',
  navigationBackground: '#262626',
  navigationBackgroundHighlight: '#3B3B3B',

  // Foreground
  foregroundPrimary: colors.white100,
  foregroundSecondary: '#B2B2B2',
  foregroundTertiary: '#666666',

  // Other
  gradientHelper: '#00000000',

  // Vibrant
  greenBackground: colors.greenDark,
  greenForeground: colors.greenLight,
  pinkBackground: colors.pinkDark,
  pinkForeground: colors.pinkLight,
  redBackground: colors.redDark,
  redForeground: colors.redLight,
}
