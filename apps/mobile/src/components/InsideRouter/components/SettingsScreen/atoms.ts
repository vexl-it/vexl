import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {type ImportContactFromLinkPayload} from '../../../../state/contacts/domain'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../../state/session'
import {screenshotsDisabledAtom} from '../../../../state/showYouDidNotAllowScreenshotsActionAtom'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'

export const reportIssueDialogVisibleAtom = atom<boolean>(false)
export const changeCurrencyDialogVisibleAtom = atom<boolean>(false)
export const qrCodeDialogVisibleAtom = atom<boolean>(false)
export const qrScannerDialogVisibleAtom = atom<boolean>(false)

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
