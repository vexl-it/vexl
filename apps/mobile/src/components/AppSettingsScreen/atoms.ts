import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/src/general/currency.brand'
import {keys} from '@vexl-next/resources-utils/src/utils/keys'
import {Array, String, pipe} from 'effect'
import {atom, type SetStateAction} from 'jotai'
import {screenshotsDisabledAtom} from '../../state/showYouDidNotAllowScreenshotsActionAtom'
import {
  supportedTranslations,
  translationAtom,
  type TFunction,
} from '../../utils/localization/I18nProvider'
import {currencies} from '../../utils/localization/currency'
import {isDeveloperAtom} from '../../utils/preferences'

export const appSettingsLanguageSearchTextAtom = atom('')
export const appSettingsCurrencySearchTextAtom = atom('')

const languages = keys(supportedTranslations)
const appSettingsDevLanguage = 'dev'
const allCurrencies = Object.values(currencies)

const getNextBooleanValue = (
  next: SetStateAction<boolean>,
  current: boolean
): boolean => (typeof next === 'function' ? next(current) : next)

const matchesSearchText = (searchText: string, value: string): boolean =>
  pipe(
    value,
    String.toLowerCase,
    String.includes(String.toLowerCase(searchText))
  )

const matchesCurrency =
  (searchText: string) =>
  (currency: CurrencyInfo): boolean =>
    matchesSearchText(searchText, currency.name) ||
    matchesSearchText(searchText, currency.code)

export type AppSettingsLanguage =
  | keyof typeof supportedTranslations
  | typeof appSettingsDevLanguage

export function getAppSettingsLanguageLabel(
  language: AppSettingsLanguage,
  t: TFunction
): string {
  if (language === appSettingsDevLanguage) return 'English DEV'
  return t(`settings.items.language.${language}`)
}

export function getAppSettingsLanguageFlag(
  language: AppSettingsLanguage
): string {
  if (language === appSettingsDevLanguage) return '🇬🇧'
  return supportedTranslations[language].flag
}

export const appSettingsLanguagesAtom = atom<AppSettingsLanguage[]>((get) => {
  if (__DEV__ || get(isDeveloperAtom))
    return [appSettingsDevLanguage, ...languages]
  return languages
})

export const appSettingsLanguagesToDisplayAtom = atom((get) => {
  const searchText = get(appSettingsLanguageSearchTextAtom)
  const languagesToDisplay = get(appSettingsLanguagesAtom)
  const {t} = get(translationAtom)

  if (String.isEmpty(searchText)) return languagesToDisplay
  return pipe(
    languagesToDisplay,
    Array.filter(
      (language) =>
        matchesSearchText(
          searchText,
          getAppSettingsLanguageLabel(language, t)
        ) || matchesSearchText(searchText, language)
    )
  )
})

export const appSettingsCurrenciesToDisplayAtom = atom((get) => {
  const searchText = get(appSettingsCurrencySearchTextAtom)

  if (String.isEmpty(searchText)) return allCurrencies
  return pipe(allCurrencies, Array.filter(matchesCurrency(searchText)))
})

export const allowScreenshotsAtom = atom(
  (get) => !get(screenshotsDisabledAtom),
  (get, set, next: SetStateAction<boolean>) => {
    const nextValue = getNextBooleanValue(next, !get(screenshotsDisabledAtom))
    set(screenshotsDisabledAtom, !nextValue)
  }
)

export type AppSettingsCurrencyCode = CurrencyCode
