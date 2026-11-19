import {Effect} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {navigationRef} from '../../../utils/navigation'
import {askAreYouSureActionAtom} from '../../GlobalDialog'
import DonationPrompt from '../components/DonationPrompt'
import {claimDonationPromptDisplayActionAtom} from './stateAtoms'

const showDonationPromptGiveLoveActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  if (!set(claimDonationPromptDisplayActionAtom, {skipCooldown: true}))
    return Effect.void

  return Effect.gen(function* (_) {
    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: DonationPrompt,
            positiveButtonText: t('donationPrompt.donate'),
            negativeButtonText: t('common.close'),
          },
        ],
      })
    )

    if (navigationRef.isReady()) {
      navigationRef.navigate('DonationsFlow', {screen: 'SetDonation'})
    }
  }).pipe(Effect.catchTag('UserDeclinedError', () => Effect.void))
})

export default showDonationPromptGiveLoveActionAtom
