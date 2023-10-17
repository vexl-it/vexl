import {translations, type LocaleKeys} from '@vexl-next/localizations'
import {getLocales} from 'expo-localization'
import type {TranslateOptions} from 'i18n-js'
import {I18n} from 'i18n-js'
import {atom, useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {enableHiddenFeatures} from '../environment'
// SETUP I18n
export const i18n = new I18n(
  enableHiddenFeatures
    ? translations
    : {
        en: {localeName: 'en', ...translations.en},
        de: {localeName: 'de', ...translations.de},
        cs: {localeName: 'cs', ...translations.cs},
        sk: {localeName: 'sk', ...translations.sk},
      }
)
i18n.locale = getLocales().at(0)?.languageTag ?? 'en'
i18n.defaultLocale = 'en'
i18n.enableFallback = true
// Setup provider
export type TFunction = (key: LocaleKeys, options?: TranslateOptions) => string
interface TranslationContext {
  t: TFunction
  isEnglish: () => boolean
}
export const i18nAtom = atom(i18n)
export const translationAtom = selectAtom(
  i18nAtom,
  (i18nVal): TranslationContext => ({
    t: i18nVal.t.bind(i18nVal),
    isEnglish: (): boolean => i18nVal.t('localeName') === 'en',
  })
)
export function useTranslation(): TranslationContext {
  return useAtomValue(translationAtom)
}
