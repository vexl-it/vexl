/**
 * Font map for use with expo-font's `useFonts` hook.
 * Keys must match the face names declared in the Tamagui font config.
 */
export const vexlFonts = {
  TTSatoshi400: require('./tt_satoshi_400.otf'),
  TTSatoshi500: require('./tt_satoshi_500.otf'),
  TTSatoshi600: require('./tt_satoshi_600.otf'),
  TTSatoshi700: require('./tt_satoshi_700.otf'),
  PPMonument400: require('./pp_monument_400.ttf'),
  PPMonument700: require('./pp_monument_700.ttf'),
} satisfies Record<string, number>
