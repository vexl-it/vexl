import {mergeToBoolean} from '@vexl-next/generic-utils/src/effect-helpers/mergeToBoolean'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {Platform} from 'react-native'
import {
  clubsConnectionsReachAtom,
  fistAndSecondLevelConnectionsReachAtom,
} from '../../../../state/connections/atom/connectionStateAtom'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../../state/session/userDataAtoms'
import {screenshotsDisabledAtom} from '../../../../state/showYouDidNotAllowScreenshotsActionAtom'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {createImportContactLink} from '../../../../utils/deepLinks/createLinks'
import {version, versionCode} from '../../../../utils/environment'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../../utils/localization/localizedNumbersAtoms'
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

  return createImportContactLink({
    phoneNumber,
    userData,
  })
})

export const emailBodyAtom = atom<string>((get) => {
  const {t} = get(translationAtom)

  return encodeURIComponent(
    `${t('reportIssue.predefinedBody')}\n\n\n\n\n
    ${t('reportIssue.appAndOperatingSystemInfo')} (${t('reportIssue.pleaseDoNotDelete')}): ${version}(${versionCode}), ${Platform.OS} ${Platform.Version}\n\n`
  )
})

export const qrScannerDialogAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return set(askAreYouSureActionAtom, {
    variant: 'info',
    steps: [
      {
        type: 'StepWithChildren',
        MainSectionComponent: QrScanner,
        positiveButtonText: t('common.close'),
      },
    ],
  })
})

export const showReachNumberDetailsActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const clubsConnectionsReach = set(localizedDecimalNumberActionAtom, {
    number: get(clubsConnectionsReachAtom),
  })

  const fistAndSecondLevelConnectionsReach = set(
    localizedDecimalNumberActionAtom,
    {number: get(fistAndSecondLevelConnectionsReachAtom)}
  )

  return set(askAreYouSureActionAtom, {
    variant: 'info',
    steps: [
      {
        type: 'StepWithText',
        title: t('settings.whatDoesYourReachMean'),
        description: t('settings.yourReachConsistsOf', {
          firstAndSecondLevelConnections: fistAndSecondLevelConnectionsReach,
          clubConnections: clubsConnectionsReach,
        }),
        positiveButtonText: t('postLoginFlow.importContactsButton'),
        negativeButtonText: t('common.goBack'),
      },
    ],
  }).pipe(mergeToBoolean)
})
