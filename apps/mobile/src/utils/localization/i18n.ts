import {getLocales} from 'expo-localization'
import {I18n} from 'i18n-js'
import cs from '../../localization/cs'
import en from '../../localization/en'

const i18n = new I18n({
  en,
  cs,
})

i18n.locale = getLocales()[0].languageTag

i18n.defaultLocale = 'en'
i18n.enableFallback = true

export default i18n
export type Dictionary = typeof en
