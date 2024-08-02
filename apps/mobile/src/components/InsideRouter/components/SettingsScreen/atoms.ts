import {pipe} from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {Platform} from 'react-native'
import {type ImportContactFromLinkPayload} from '../../../../state/contacts/domain'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../../state/session'
import {screenshotsDisabledAtom} from '../../../../state/showYouDidNotAllowScreenshotsActionAtom'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {version} from '../../../../utils/environment'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import openUrl from '../../../../utils/openUrl'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import QrScanner from './components/QrScanner'

export const changeCurrencyDialogVisibleAtom = atom<boolean>(false)

export const selectedLanguageAtom = atom<string>('en')

export function createIsLanguageSelectedAtom(
  selectedLanguage: string
): WritableAtom<boolean, [SetStateAction<boolean>], void> {
  return atom(
    (get) => get(selectedLanguageAtom) === selectedLanguage,
    (get, set, isSelected: SetStateAction<boolean>) => {
      const selected = getValueFromSetStateActionOfAtom(isSelected)(
        () => get(selectedLanguageAtom) === selectedLanguage
      )

      if (!selected) set(selectedLanguageAtom, selectedLanguage)
    }
  )
}

export const toggleScreenshotsDisabledActionAtom = atom(null, (get, set) => {
  set(screenshotsDisabledAtom, !get(screenshotsDisabledAtom))
})

export const encodedUserDetailsUriAtom = atom<string>((get) => {
  const userData = get(userDataRealOrAnonymizedAtom)
  const phoneNumber = get(userPhoneNumberAtom)

  const userDetails: ImportContactFromLinkPayload = {
    name: userData.userName,
    label: 'Scanned from qr code',
    numberToDisplay: phoneNumber,
  }

  const userDetailsToLink = encodeURIComponent(JSON.stringify(userDetails))
  const innerLink = `https://vexl.it?type=import-contact&data=${userDetailsToLink}`
  const innerLinkEncoded = encodeURIComponent(innerLink)

  return `https://link.vexl.it/?link=${innerLinkEncoded}&apn=it.vexl.next&isi=6448051657&ibi=it.vexl.next&efr=1`
})

export const emailBodyAtom = atom<string>((get) => {
  const {t} = get(translationAtom)

  return encodeURIComponent(
    `${t('reportIssue.predefinedBody')}\n\n${Platform.OS}-${version}-${
      Platform.Version
    }\n\n`
  )
})

export const contactSupportActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const supportEmail = t('settings.items.supportEmail')
  const emailBody = get(emailBodyAtom)

  openUrl(
    `mailto:${supportEmail}?body=${emailBody}`,
    t('settings.items.supportEmail')
  )()
})

export const qrScannerDialogAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: QrScanner,
          positiveButtonText: t('common.close'),
        },
      ],
    }),
    TE.match(
      () => {},
      () => {}
    )
  )()
})
