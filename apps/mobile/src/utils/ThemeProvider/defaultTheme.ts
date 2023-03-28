export const theme = {
  fonts: {
    ppMonument: 'PP Monument',
    ttSatoshi400: 'TT Satoshi 400',
    ttSatoshi500: 'TT Satoshi 500',
    ttSatoshi600: 'TT Satoshi 600',
    ttSatoshi700: 'TT Satoshi 700',
  },
  fontSizes: {
    default: 18,
    heading2: 32,
  },
  spacings: {
    xs: 8,
    small: 16,
    medium: 24,
    large: 32,
    xl: 40,
  },
  colors: {
    backgroundBlack: '#101010',
    backgroundWhite: '#FFFFFF',
    lightColorText: '#FFFFFF',
    darkColorText: '#000000',
    main: '#FCCD6C',
    white: '#FFFFFF',
    grey: '#262626',
    red: '#EE675E',
    darkBrown: '#322717',
    black: '#000000',
    grayOnBlack: '#AFAFAF',
    grayOnWhite: '#808080',
  },
}

export type Spacing = typeof theme.spacings
export type Color = keyof typeof theme.colors
export type Theme = typeof theme
export default theme
