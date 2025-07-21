import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../../utils/preferences'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import DonationPrompt from '../components/DonationPrompt'
import showDonationPromptActionAtom from './showDonationPromptActionAtom'
import {shouldShowDonationPromptAtom} from './stateAtoms'

const showDonationPromptGiveLoveActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const shouldShowDonationPrompt = get(shouldShowDonationPromptAtom)

  if (!shouldShowDonationPrompt) return Effect.succeed(Effect.void)

  return Effect.gen(function* (_) {
    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: DonationPrompt,
            positiveButtonText: t('donationPrompt.donate'),
            negativeButtonText: t('common.back'),
          },
        ],
      })
    )

    yield* _(set(showDonationPromptActionAtom))
  }).pipe(
    Effect.catchTag('UserDeclinedError', () => {
      set(
        lastDisplayOfDonationPromptTimestampAtom,
        Schema.decodeSync(UnixMillisecondsE)(DateTime.now().toMillis())
      )

      return Effect.succeed(Effect.void)
    })
  )
})

export default showDonationPromptGiveLoveActionAtom
