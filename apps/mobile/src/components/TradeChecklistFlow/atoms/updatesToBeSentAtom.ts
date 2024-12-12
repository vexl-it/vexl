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
import {pipe} from 'effect'
import fastDeepEqual from 'fast-deep-equal'
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
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
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
    !fastDeepEqual(get(updatesToBeSentAtom), UPDATES_TO_BE_SENT_INITIAL_STATE)
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

export const submitTradeChecklistUpdatesActionAtom = atom(
  null,
  (get, set): T.Task<boolean> => {
    const {t} = get(translationAtom)
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
      return T.of(false)
    }

    const updatesToBeSent = get(updatesToBeSentAtom)
    if (Object.keys(updatesToBeSent).length === 0) return T.of(true) // No updates to be sent

    set(loadingOverlayDisplayedAtom, true)

    return pipe(
      set(submitTradeChecklistUpdateAtom, get(updatesToBeSentAtom)),
      TE.match(
        (e) => {
          showErrorAlert({
            title:
              toCommonErrorMessage(e, get(translationAtom).t) ??
              t('common.unknownError'),
            error: e,
          })

          reportError(
            'error',
            new Error('Error submitting trade checklist update'),
            {e}
          )
          return false
        },
        () => {
          set(clearUpdatesToBeSentActionAtom)

          return true
        }
      ),
      T.map((r) => {
        set(loadingOverlayDisplayedAtom, false)
        return r
      })
    )
  }
)
