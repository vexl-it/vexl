import {getLocales} from 'expo-localization'
import {I18n} from 'i18n-js'

const i18n = new I18n({
  en: require('../../../localization/en.json'),
  cs: require('../../../localization/cs.json'),
})

i18n.locale = getLocales()[0].languageTag

i18n.defaultLocale = 'en'
i18n.enableFallback = true

export default i18n
