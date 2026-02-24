// Theme tokens from Figma — Vexl redesign DEV (node 593:39715)
// Both themes share an identical set of keys

export const lightTheme = {
  // Accents
  accentHighlightPrimary: '#000000',
  accentHighlightSecondary: '#BE8821',
  accentYellowPrimary: '#FCCD6C',
  accentYellowSecondary: '#FFE1A2',

  // Background
  backgroundHighlight: '#D6D4DB',
  backgroundOnBar: '#FFFFFF',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F6F5F8',
  backgroundTertiary: '#EFEDF3',
  navigationBackground: '#F5F3ED',
  navigationBackgroundHighlight: '#FFE1A2',

  // Foreground
  foregroundPrimary: '#000000',
  foregroundSecondary: '#666666',
  foregroundTertiary: '#999999',

  // Other
  gradientHelper: '#FFFFFF00',

  // Vibrant
  greenBackground: '#ACD9B7',
  greenForeground: '#455749',
  pinkBackground: '#FCC5F3',
  pinkBright100: '#FCC5F3',
  pinkForeground: '#654F61',
  redBackground: '#EE675E',
  redForeground: '#A0433C',
}

export const darkTheme: typeof lightTheme = {
  // Accents
  accentHighlightPrimary: '#FCCD6C',
  accentHighlightSecondary: '#FCCD6C',
  accentYellowPrimary: '#FCCD6C',
  accentYellowSecondary: '#4C3E20',

  // Background
  backgroundHighlight: '#6F6F6F',
  backgroundOnBar: '#363636',
  backgroundPrimary: '#000000',
  backgroundSecondary: '#262626',
  backgroundTertiary: '#363636',
  navigationBackground: '#262626',
  navigationBackgroundHighlight: '#3B3B3B',

  // Foreground
  foregroundPrimary: '#FFFFFF',
  foregroundSecondary: '#B2B2B2',
  foregroundTertiary: '#666666',

  // Other
  gradientHelper: '#00000000',

  // Vibrant
  greenBackground: '#455749',
  greenForeground: '#ACD9B7',
  pinkBackground: '#654F61',
  pinkBright100: '#FCC5F3',
  pinkForeground: '#FCC5F3',
  redBackground: '#A0433C',
  redForeground: '#EE675E',
}
