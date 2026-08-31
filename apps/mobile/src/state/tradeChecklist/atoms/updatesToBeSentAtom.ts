import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {deepEqual} from 'fast-equals'
import {atom} from 'jotai'

const UPDATES_TO_BE_SENT_INITIAL_STATE = {}

export const updatesToBeSentAtom = atom<TradeChecklistUpdate>(
  UPDATES_TO_BE_SENT_INITIAL_STATE
)

export const areThereUpdatesToBeSentAtom = atom(
  (get) =>
    !deepEqual(get(updatesToBeSentAtom), UPDATES_TO_BE_SENT_INITIAL_STATE)
)

export const clearUpdatesToBeSentActionAtom = atom(null, (_get, set) => {
  set(updatesToBeSentAtom, UPDATES_TO_BE_SENT_INITIAL_STATE)
})
