import {
  appLocaleCatalogs,
  dev,
  type TranslationKey,
} from '@vexl-next/localization/src/translations'
import {map} from 'effect/Record'
import {getLocales} from 'expo-localization'
import {createInstance, type TOptions} from 'i18next'
import {atom, getDefaultStore, useAtomValue} from 'jotai'
import {isStaging} from '../environment'
import {normalizeFormattingLocale} from './formatting'

export const supportedTranslations = appLocaleCatalogs

export function devAwareLng(language: string): string {
  return language === 'dev' ? 'en_dev' : language
}

type I18nInstance = ReturnType<typeof createInstance>

export function createI18nInstance(language: string): I18nInstance {
  const resources = {
    ...map(appLocaleCatalogs, (catalog) => ({translation: catalog})),
    en_dev: {translation: dev},
  }
  const instance = createInstance({
    resources,
    lng: devAwareLng(language),
    fallbackLng: 'en',
    keySeparator: false,
    nsSeparator: false,
    returnNull: false,
    showSupportNotice: false,
    interpolation: {escapeValue: false},
  })

  void instance.init()
  return instance
}

const initialLanguage = isStaging
  ? 'en_dev'
  : (getLocales().at(0)?.languageTag ?? 'en')

export const i18n = createI18nInstance(initialLanguage)

export type TFunction = (
  key: TranslationKey,
  options?: TOptions & Record<string, unknown>
) => string

export interface TranslationContext {
  t: TFunction
  isEnglish: () => boolean
}

export const i18nAtom = atom(i18n)
export const showDevLabelsAtom = atom(false)

export const translationAtom = atom((get): TranslationContext => {
  const i18nVal = get(i18nAtom)
  const showDevLabels = get(showDevLabelsAtom)
  return {
    t: !showDevLabels
      ? (key, options) =>
          options ? i18nVal.t(key, key, options) : i18nVal.t(key)
      : (key) => key,
    isEnglish: (): boolean => i18nVal.t('localeName') === 'en',
  }
})

export function useTranslation(): TranslationContext {
  return useAtomValue(translationAtom)
}

export function getCurrentLocale(): string {
  const language = getDefaultStore().get(i18nAtom).resolvedLanguage ?? 'en'
  return normalizeFormattingLocale(language === 'en_dev' ? 'en' : language)
}

export function getLocaleFromTranslation(t: TFunction): string {
  const locale = t('localeName')
  return normalizeFormattingLocale(locale === 'localeName' ? undefined : locale)
}
