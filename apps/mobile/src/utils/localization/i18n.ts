import {getLocales} from 'expo-localization'
import {I18n} from 'i18n-js'
import cs from '../../localization/cs'
import en from '../../localization/en'
import sk from '../../localization/sk'

const i18n = new I18n({
  en,
  cs,
  sk,
})

i18n.locale = getLocales()[0].languageTag

i18n.defaultLocale = 'en'
i18n.enableFallback = true

type PathInto<T extends Record<string, any>> = keyof {
  [K in keyof T as T[K] extends string
    ? K
    : T[K] extends Record<string, any>
    ? `${K & string}.${PathInto<T[K]> & string}`
    : never]: any
}

export type LocaleKeys = PathInto<typeof en>
export default i18n
