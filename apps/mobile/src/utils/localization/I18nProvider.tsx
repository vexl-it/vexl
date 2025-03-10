import * as translations from '@vexl-next/localization/src/translations'
import {getLocales} from 'expo-localization'
import type {TranslateOptions} from 'i18n-js'
import {I18n} from 'i18n-js'
import {atom, useAtomValue} from 'jotai'
import {enableHiddenFeatures, isStaging} from '../environment'

const {dev: devTranslation, ...prodTranslations} = translations

// ⚠️⚠️
// ⚠️ Warning: Remember to add language support also to useSetRelativeDateFormatting.ts when adding new language ⚠️
// ⚠️⚠️
export const supportedTranslations = {
  en: translations.en,
  de: translations.de,
  cs: translations.cs,
  sk: translations.sk,
  pl: translations.pl,
  bg: translations.bg,
  ja: translations.ja,
  es: translations.es,
  it: translations.it,
  pt: translations.pt,
  nl: translations.nl,
  sw: translations.sw,
}

// SETUP I18n
export const i18n = new I18n(
  enableHiddenFeatures
    ? {'en_dev': devTranslation, ...prodTranslations}
    : {
        en_dev: translations.dev,
        ...supportedTranslations,
      }
)
i18n.locale = isStaging ? 'en_dev' : (getLocales().at(0)?.languageTag ?? 'en')
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
export const showDevLabelsAtom = atom(false)

export const translationAtom = atom((get): TranslationContext => {
  const i18nVal = get(i18nAtom)
  const showDevLabels = get(showDevLabelsAtom)
  return {
    t: !showDevLabels ? i18nVal.t.bind(i18nVal) : (val) => val,
    isEnglish: (): boolean => i18nVal.t('localeName') === 'en',
  }
})

export function useTranslation(): TranslationContext {
  return useAtomValue(translationAtom)
}

export function getCurrentLocale(): string {
  return (i18n.locale === 'en_dev' ? 'en' : i18n.locale) ?? 'en'
}
