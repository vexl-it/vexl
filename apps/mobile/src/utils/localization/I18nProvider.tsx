import type {TranslateOptions} from 'i18n-js'
import {translations, type LocaleKeys} from '@vexl-next/localizations'
import {atom, useAtomValue} from 'jotai'
import {I18n} from 'i18n-js'
import {enableHiddenFeatures} from '../environment'
import {getLocales} from 'expo-localization'

// SETUP I18n
export const i18n = new I18n(
  enableHiddenFeatures ? translations : {en: translations.en}
)
i18n.locale = getLocales()[0].languageTag
i18n.defaultLocale = 'en'
i18n.enableFallback = true

// Setup provider
export type TFunction = (key: LocaleKeys, options?: TranslateOptions) => string

interface TranslationContext {
  t: TFunction
}

export const translationAtom = atom<TranslationContext>({t: i18n.t.bind(i18n)})

export function useTranslation(): TranslationContext {
  return useAtomValue(translationAtom)
}
