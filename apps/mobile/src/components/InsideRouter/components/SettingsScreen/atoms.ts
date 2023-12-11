import {
  userPhoneNumberAtom,
  userDataRealOrAnonymizedAtom,
} from '../../../../state/session'
import {atom} from 'jotai'
import {type ImportContactFromLinkPayload} from '../../../../state/contacts/domain'
import {screenshotsDisabledAtom} from '../../../../state/showYouDidNotAllowScreenshotsActionAtom'

export const reportIssueDialogVisibleAtom = atom<boolean>(false)
export const changeCurrencyDialogVisibleAtom = atom<boolean>(false)
export const qrCodeDialogVisibleAtom = atom<boolean>(false)
export const qrScannerDialogVisibleAtom = atom<boolean>(false)

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
