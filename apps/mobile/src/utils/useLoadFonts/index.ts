// eslint-disable @typescript-eslint/no-var-requires
import {useFonts} from 'expo-font'

export default function useLoadFonts(): [boolean, Error | null] {
  return useFonts({
    PPMonument: require('./fonts/pp_monument_700.ttf'),
    TTSatoshi400: require('./fonts/tt_satoshi_400.otf'),
    TTSatoshi500: require('./fonts/tt_satoshi_500.otf'),
    TTSatoshi600: require('./fonts/tt_satoshi_600.otf'),
    TTSatoshi700: require('./fonts/tt_satoshi_700.otf'),
  })
}
