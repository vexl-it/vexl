import Clipboard from '@react-native-clipboard/clipboard'
import {
  type AmountData,
  type ContactReveal,
  type IdentityReveal,
  type MeetingLocationData,
  type NetworkData,
  type PickedDateTimeOption,
  type TradeChecklistUpdate,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, pipe} from 'effect'
import {deepEqual} from 'fast-equals'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {Alert} from 'react-native'
import {createCanSendMessagesAtom} from '../../../state/chat/atoms/createCanSendMessagesAtom'
import createSubmitChecklistUpdateActionAtom from '../../../state/chat/atoms/sendTradeChecklistUpdateActionAtom'
import {
  chatWithMessagesAtom,
  tradeChecklistDataAtom,
} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {updateTradeChecklistState} from '../../../state/tradeChecklist/utils'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {availableDateTimesAtom} from '../components/DateAndTimeFlow/atoms'

const UPDATES_TO_BE_SENT_INITIAL_STATE = {}

const updatesToBeSentAtom = atom<TradeChecklistUpdate>(
  UPDATES_TO_BE_SENT_INITIAL_STATE
)
export default updatesToBeSentAtom

export const areThereUpdatesToBeSentAtom = atom(
  (get) =>
    !deepEqual(get(updatesToBeSentAtom), UPDATES_TO_BE_SENT_INITIAL_STATE)
)

const clearUpdatesToBeSentActionAtom = atom(null, (get, set) => {
  set(updatesToBeSentAtom, UPDATES_TO_BE_SENT_INITIAL_STATE)
})

export const askAreYouSureAndClearUpdatesToBeSentActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)
    const areThereUpdatesToBeSent = get(areThereUpdatesToBeSentAtom)

    if (!areThereUpdatesToBeSent) return T.of(true)

    return pipe(
      set(askAreYouSureActionAtom, {
        variant: 'danger',
        steps: [
          {
            type: 'StepWithText',
            title: t('tradeChecklist.discardChanges'),
            description: t('tradeChecklist.allChangesWillBeLost'),
            positiveButtonText: t('common.discard'),
            negativeButtonText: t('common.back'),
          },
        ],
      }),
      effectToTaskEither,
      TE.match(
        () => {
          return false
        },
        () => {
          set(clearUpdatesToBeSentActionAtom)
          return true
        }
      )
    )
  }
)

export const dateAndTimePickUpdateToBeSentAtom = atom(
  (get) => get(updatesToBeSentAtom).dateAndTime?.picks?.dateTime
)

export const amountUpdateToBeSentAtom = atom(
  (get) => get(updatesToBeSentAtom).amount
)

export const networkUpdateToBeSentAtom = atom(
  (get) => get(updatesToBeSentAtom).network?.btcNetwork
)

export const tradeChecklistWithUpdatesMergedAtom = atom((get) => {
  const tradeChecklistData = get(tradeChecklistDataAtom)
  const update = get(updatesToBeSentAtom)
  return updateTradeChecklistState(tradeChecklistData)({
    update,
    direction: 'sent',
  })
})

export const addDateAndTimeSuggestionsActionAtom = atom(null, (get, set) => {
  const suggestions = get(availableDateTimesAtom)

  set(updatesToBeSentAtom, (updates) => ({
    ...updates,
    dateAndTime: {
      suggestions,
      timestamp: unixMillisecondsNow(),
    },
  }))
})

export const saveDateTimePickActionAtom = atom(
  null,
  (get, set, picks: PickedDateTimeOption) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      dateAndTime: {
        picks,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

export const addAmountActionAtom = atom(
  null,
  (get, set, amountData: AmountData) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      amount: {
        ...amountData,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

export const addNetworkActionAtom = atom(
  null,
  (get, set, networkData: NetworkData) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      network: {
        ...networkData,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

export const revealIdentityActionAtom = atom(
  null,
  (get, set, identity: IdentityReveal) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      identity: {
        ...identity,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

export const revealContactActionAtom = atom(
  null,
  (get, set, contact: ContactReveal) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      contact: {
        ...contact,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

export const addMeetingLocationActionAtom = atom(
  null,
  (get, set, locationData: MeetingLocationData) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      location: {
        data: locationData,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

export const submitTradeChecklistUpdatesActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  return Effect.gen(function* (_) {
    const submitTradeChecklistUpdateAtom =
      createSubmitChecklistUpdateActionAtom(chatWithMessagesAtom)

    const canSendMessagesAtom = createCanSendMessagesAtom(
      focusAtom(chatWithMessagesAtom, (s) => s.prop('messages'))
    )

    if (!get(canSendMessagesAtom)) {
      Alert.alert(
        t('tradeChecklist.cannotSendMessages'),
        t('tradeChecklist.cannotSendMessagesDescription')
      )
      return false
    }

    if (Object.keys(get(updatesToBeSentAtom)).length === 0) return true // No updates to be sent

    set(loadingOverlayDisplayedAtom, true)

    yield* _(set(submitTradeChecklistUpdateAtom, get(updatesToBeSentAtom)))

    set(clearUpdatesToBeSentActionAtom)
    set(loadingOverlayDisplayedAtom, false)

    return true
  }).pipe(
    Effect.catchAll((e) => {
      reportError(
        'error',
        new Error('Error submitting trade checklist update'),
        {e}
      )

      return Effect.zipRight(
        set(askAreYouSureActionAtom, {
          variant: 'danger',
          steps: [
            {
              type: 'StepWithText',
              title: t('common.somethingWentWrong'),
              description: t('common.somethingWentWrongDescription'),
              positiveButtonText: t('common.copyErrorToClipboard'),
              negativeButtonText: t('common.close'),
            },
          ],
        }).pipe(
          Effect.tap(() => {
            Clipboard.setString(JSON.stringify(e, null, 2))
          }),
          Effect.ignore
        ),
        Effect.succeed(false)
      )
    })
  )
})
