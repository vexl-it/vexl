import {atom} from 'jotai'
import {
  type AmountData,
  type AvailableDateTimeOption,
  type NetworkData,
  type PickedDateTimeOption,
  type TradeChecklistUpdate,
} from '@vexl-next/domain/dist/general/tradeChecklist'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import createSubmitChecklistUpdateActionAtom from '../../../state/chat/atoms/sendTradeChecklistUpdateActionAtom'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import reportError from '../../../utils/reportError'
import {chatWithMessagesAtom, tradeChecklistDataAtom} from './fromChatAtoms'
import {updateTradeChecklistState} from '../../../state/tradeChecklist/utils'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'

const UPDATES_TO_BE_SENT_INITIAL_STATE = {}

const updatesToBeSentAtom = atom<TradeChecklistUpdate>(
  UPDATES_TO_BE_SENT_INITIAL_STATE
)
export default updatesToBeSentAtom

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
          reportError('error', 'Error submitting trade checklist update', e)
          return false
        },
        () => {
          set(updatesToBeSentAtom, {})
          set(loadingOverlayDisplayedAtom, false)
          return true
        }
      )
    )
  }
)
