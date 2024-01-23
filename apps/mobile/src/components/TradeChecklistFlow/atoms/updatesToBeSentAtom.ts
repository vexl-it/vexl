import {
  type AmountData,
  type AvailableDateTimeOption,
  type ContactReveal,
  type IdentityReveal,
  type MeetingLocationData,
  type NetworkData,
  type PickedDateTimeOption,
  type TradeChecklistUpdate,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import createSubmitChecklistUpdateActionAtom from '../../../state/chat/atoms/sendTradeChecklistUpdateActionAtom'
import {
  chatWithMessagesAtom,
  tradeChecklistDataAtom,
} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {updateTradeChecklistState} from '../../../state/tradeChecklist/utils'
import reportError from '../../../utils/reportError'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'

const UPDATES_TO_BE_SENT_INITIAL_STATE = {}

const updatesToBeSentAtom = atom<TradeChecklistUpdate>(
  UPDATES_TO_BE_SENT_INITIAL_STATE
)
export default updatesToBeSentAtom

export const dateAndTimePickUpdateToBeSentAtom = atom(
  (get) => get(updatesToBeSentAtom).dateAndTime?.picks?.dateTime
)

export const btcAmountUpdateToBeSentAtom = atom(
  (get) => get(updatesToBeSentAtom).amount?.btcAmount?.toString()
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

export const addDateAndTimeSuggestionsActionAtom = atom(
  null,
  (get, set, suggestions: AvailableDateTimeOption[]) => {
    set(updatesToBeSentAtom, (updates) => ({
      ...updates,
      dateAndTime: {
        suggestions,
        timestamp: unixMillisecondsNow(),
      },
    }))
  }
)

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
    const submitTradeChecklistUpdateAtom =
      createSubmitChecklistUpdateActionAtom(chatWithMessagesAtom)

    const updatesToBeSent = get(updatesToBeSentAtom)
    if (Object.keys(updatesToBeSent).length === 0) return T.of(true) // No updates to be sent

    set(loadingOverlayDisplayedAtom, true)

    return pipe(
      set(submitTradeChecklistUpdateAtom, get(updatesToBeSentAtom)),
      TE.match(
        (e) => {
          reportError(
            'error',
            new Error('Error submitting trade checklist update'),
            {e}
          )
          return false
        },
        () => {
          set(updatesToBeSentAtom, {})

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
