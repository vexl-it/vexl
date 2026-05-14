import {Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'

const AccountStats = Schema.Struct({
  closedChats: Schema.Int,
  postedOffers: Schema.Int,
})

export const accountStatsAtom = atomWithParsedMmkvStorage(
  'accountStats',
  {
    closedChats: 0,
    postedOffers: 0,
  },
  AccountStats
)

export const closedChatsAtom = focusAtom(accountStatsAtom, (optic) =>
  optic.prop('closedChats')
)

export const postedOffersAtom = focusAtom(accountStatsAtom, (optic) =>
  optic.prop('postedOffers')
)

export const incrementClosedChatsActionAtom = atom(null, (get, set) => {
  set(closedChatsAtom, get(closedChatsAtom) + 1)
})

export const incrementPostedOffersActionAtom = atom(null, (get, set) => {
  set(postedOffersAtom, get(postedOffersAtom) + 1)
})
