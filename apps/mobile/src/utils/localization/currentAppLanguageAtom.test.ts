import {getLocales, type Locale} from 'expo-localization'
import {createStore} from 'jotai'
import {storage} from '../mmkv/effectMmkv'
import {
  appLanguageFromPreferencesAtom,
  currentAppLanguageAtom,
} from '../preferences'
import {formattingLocaleAtom} from './formattingLocaleAtom'

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{languageCode: 'cs', languageTag: 'cs-CZ'}]),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

jest.mock('react-native-mmkv')

const mockedGetLocales = jest.mocked(getLocales)

function createLocales(
  languageCode: string | null,
  languageTag: string
): [Locale, ...Locale[]] {
  return [
    {
      languageTag,
      languageCode,
      languageScriptCode: null,
      regionCode: null,
      languageRegionCode: null,
      currencyCode: null,
      currencySymbol: null,
      languageCurrencyCode: null,
      languageCurrencySymbol: null,
      decimalSeparator: null,
      digitGroupingSeparator: null,
      textDirection: 'ltr',
      measurementSystem: null,
      temperatureUnit: null,
    },
  ]
}

beforeEach(() => {
  storage._storage.clearAll()
  mockedGetLocales.mockReturnValue(createLocales('cs', 'cs-CZ'))
})

describe('currentAppLanguageAtom', () => {
  it('uses the device language code when no preference is set', () => {
    const store = createStore()

    expect(store.get(currentAppLanguageAtom)).toBe('cs')
    expect(store.get(formattingLocaleAtom)).toBe('cs')
  })

  it('uses the explicit language preference', () => {
    const store = createStore()

    store.set(appLanguageFromPreferencesAtom, 'sk')

    expect(store.get(currentAppLanguageAtom)).toBe('sk')
    expect(store.get(formattingLocaleAtom)).toBe('sk')
  })

  it('normalizes a legacy locale preference to its language code', () => {
    const store = createStore()

    store.set(appLanguageFromPreferencesAtom, 'en-US')

    expect(store.get(currentAppLanguageAtom)).toBe('en')
    expect(store.get(formattingLocaleAtom)).toBe('en-US')
  })

  it('renders the dev catalog in English', () => {
    const store = createStore()

    store.set(appLanguageFromPreferencesAtom, 'dev')

    expect(store.get(currentAppLanguageAtom)).toBe('en')
    expect(store.get(formattingLocaleAtom)).toBe('en-US')
  })

  it('falls back to English when the device language code is null', () => {
    mockedGetLocales.mockReturnValue(createLocales(null, 'und'))
    const store = createStore()

    expect(store.get(currentAppLanguageAtom)).toBe('en')
    expect(store.get(formattingLocaleAtom)).toBe('en-US')
  })
})
