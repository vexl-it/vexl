// eslint-disable @typescript-eslint/no-var-requires
import {useFonts} from 'expo-font'
import {useTheme} from '@emotion/react'

export default function useLoadFonts(): [boolean, Error | null] {
  const theme = useTheme()

  return useFonts({
    [theme.fonts.ttSatoshi400]: require('./fonts/tt_satoshi_400.otf'),
    [theme.fonts.ttSatoshi500]: require('./fonts/tt_satoshi_500.otf'),
    [theme.fonts.ttSatoshi600]: require('./fonts/tt_satoshi_600.otf'),
    [theme.fonts.ttSatoshi700]: require('./fonts/tt_satoshi_700.otf'),
    [theme.fonts.ppMonument]: require('./fonts/pp_monument_700.ttf'),
  })
}
