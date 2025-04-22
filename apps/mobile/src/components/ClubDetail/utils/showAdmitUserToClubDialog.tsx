import {Effect} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import QrScanner from '../../InsideRouter/components/SettingsScreen/components/QrScanner'

export const showAdmitUserToClubScannerActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return Effect.gen(function* (_) {
    return yield* _(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: QrScanner,
            mainSectionComponentProps: {
              title: t('clubs.admition.scan'),
              allowOnlySpecificTypes: ['request-club-admition'],
            },
            positiveButtonText: t('common.share'),
            negativeButtonText: t('common.close'),
          },
        ],
        variant: 'info',
      })
    )
  })
})
