import {
  englishLanguageCode,
  localeToLanguageCode,
  type LanguageCode,
} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Option, pipe} from 'effect'
import {getLocales} from 'expo-localization'

export const devAppLanguage = 'dev'

export function getDeviceLanguage(): LanguageCode {
  return pipe(
    Option.fromNullable(getLocales().at(0)?.languageCode),
    Option.flatMap(localeToLanguageCode),
    Option.getOrElse(() => englishLanguageCode)
  )
}
