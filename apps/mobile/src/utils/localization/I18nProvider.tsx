import type {TranslateOptions} from 'i18n-js'
import {translations, type LocaleKeys} from '@vexl-next/localizations'
import {atom, useAtomValue} from 'jotai'
import {I18n} from 'i18n-js'
import {enableHiddenFeatures} from '../environment'
import {getLocales} from 'expo-localization'
import {selectAtom} from 'jotai/utils'
import replaceBitcoinWithHoney from './replaceBitcoinWithHoney'

// SETUP I18n
export const i18n = new I18n(
  enableHiddenFeatures
    ? translations
    : {
        en: replaceBitcoinWithHoney(translations.en),
        de: replaceBitcoinWithHoney(translations.de),
      }
)
i18n.locale = getLocales()[0].languageTag
i18n.defaultLocale = 'en'
i18n.enableFallback = true

// Setup provider
export type TFunction = (key: LocaleKeys, options?: TranslateOptions) => string

interface TranslationContext {
  t: TFunction
}

export const i18nAtom = atom(i18n)
export const translationAtom = selectAtom(
  i18nAtom,
  (i18nVal): TranslationContext => ({t: i18nVal.t.bind(i18nVal)})
)

export function useTranslation(): TranslationContext {
  return useAtomValue(translationAtom)
}
