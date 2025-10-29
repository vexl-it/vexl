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

export const DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT = 10

const showDonationPromptGiveLoveActionAtom = atom(
  null,
  (get, set, {skipTimeCheck}: {skipTimeCheck: boolean}) => {
    const {t} = get(translationAtom)
    const shouldShowDonationPrompt = get(shouldShowDonationPromptAtom)

    if (!skipTimeCheck && !shouldShowDonationPrompt)
      return Effect.succeed(Effect.void)

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
  }
)

export default showDonationPromptGiveLoveActionAtom
