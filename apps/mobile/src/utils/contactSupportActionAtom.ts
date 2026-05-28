import {atom} from 'jotai'
import {Platform} from 'react-native'
import {version, versionCode} from './environment'
import {translationAtom} from './localization/I18nProvider'
import openUrl from './openUrl'

export const contactSupportActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const supportEmail = t('settings.items.supportEmail')
  const emailBody = encodeURIComponent(
    `${t('reportIssue.predefinedBody')}\n\n
    ---------
    ${t('reportIssue.pleaseDoNotDelete')}:
    ${t('reportIssue.appAndOperatingSystemInfo')}: ${version}(${versionCode}), ${Platform.OS} ${Platform.Version}\n\n`
  )

  openUrl(
    `mailto:${supportEmail}?body=${emailBody}`,
    t('settings.items.supportEmail')
  )()
})
