import {getLocales} from 'expo-localization'
import type {TranslateOptions} from 'i18n-js'
import {I18n} from 'i18n-js'
import {atom, useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {enableHiddenFeatures, isStaging} from '../environment'
import * as translations from './translations'
// SETUP I18n
export const i18n = new I18n(
  enableHiddenFeatures
    ? {'en_dev': {localeName: 'en_dev', ...translations.dev}, ...translations}
    : {
        'en_dev': {localeName: 'en_dev', ...translations.dev},
        en: {localeName: 'en', ...translations.en},
        de: {localeName: 'de', ...translations.de},
        cs: {localeName: 'cs', ...translations.cs},
        sk: {localeName: 'sk', ...translations.sk},
      }
)
i18n.defaultSeparator = '$'
i18n.locale = isStaging ? 'en_dev' : getLocales().at(0)?.languageTag ?? 'en'
i18n.defaultLocale = 'en_dev'
i18n.enableFallback = true
// Setup provider
export type TFunction = (
  key: keyof typeof translations.dev,
  options?: TranslateOptions
) => string

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

export function getCurrentLocale(): string {
  return (i18n.locale === 'en_dev' ? 'en' : i18n.locale) ?? 'en'
}
