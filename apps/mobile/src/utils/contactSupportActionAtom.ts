import {atom} from 'jotai'
import {emailBodyAtom} from '../components/InsideRouter/components/SettingsScreen/atoms'
import {translationAtom} from './localization/I18nProvider'
import openUrl from './openUrl'

export const contactSupportActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const supportEmail = t('settings.items.supportEmail')
  const emailBody = get(emailBodyAtom)

  openUrl(
    `mailto:${supportEmail}?body=${emailBody}`,
    t('settings.items.supportEmail')
  )()
})
