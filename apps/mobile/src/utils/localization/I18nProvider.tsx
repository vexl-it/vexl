import {type LanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {
  appLocaleCatalogs,
  dev,
  type TranslationKey,
} from '@vexl-next/localization/src/translations'
import {map} from 'effect/Record'
import {createInstance, type TOptions} from 'i18next'
import {atom, getDefaultStore, useAtomValue} from 'jotai'
import {isStaging} from '../environment'
import {
  appLanguageFromPreferencesAtom,
  currentAppLanguageAtom,
} from '../preferences'
import {devAppLanguage} from './appLanguage'
import {type FormattingLocale} from './formatting'
import {formattingLocaleAtom} from './formattingLocaleAtom'

export const supportedTranslations = appLocaleCatalogs

const devCatalogLanguage = 'en_dev'

type I18nInstance = ReturnType<typeof createInstance>

function createI18nInstance(
  language: LanguageCode | typeof devCatalogLanguage
): I18nInstance {
  const resources = {
    ...map(appLocaleCatalogs, (catalog) => ({translation: catalog})),
    [devCatalogLanguage]: {translation: dev},
  }
  const instance = createInstance({
    resources,
    lng: language,
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

export type TFunction = (
  key: TranslationKey,
  options?: TOptions & Record<string, unknown>
) => string

export interface TranslationContext {
  t: TFunction
  isEnglish: () => boolean
}

const i18nLanguageAtom = atom((get) => {
  const preference = get(appLanguageFromPreferencesAtom)
  const useDevCatalog =
    preference === devAppLanguage || (preference === undefined && isStaging)
  return useDevCatalog ? devCatalogLanguage : get(currentAppLanguageAtom)
})

// Deriving the instance (instead of swapping it from an effect) keeps
// translations in sync with the language from the very first render.
export const i18nAtom = atom((get) => createI18nInstance(get(i18nLanguageAtom)))
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

export function getCurrentLocale(): FormattingLocale {
  return getDefaultStore().get(formattingLocaleAtom)
}
