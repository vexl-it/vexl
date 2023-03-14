import {type OfferInfo} from '@vexl-next/domain/dist/general/OfferInfo'
import {type Atom, atom, useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import {useCallback, useMemo} from 'react'
import {
  fetchAndDecryptOffers,
  type OfferDecryptionError,
  type OfferFetchingError,
} from './api'
import {pipe} from 'fp-ts/function'
import {useSessionAssumeLoggedIn} from '../session'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import * as TE from 'fp-ts/TaskEither'

export interface OffersStateInitial {
  readonly state: 'initial'
}

export interface OffersStateFail {
  readonly state: 'fail'
  readonly fetchingError?: OfferFetchingError | OfferDecryptionError
  offers?: OfferInfo[]
  lastRefresh?: DateTime
}

export interface OffersStateLoading {
  readonly state: 'loading'
  offers?: OfferInfo[]
  lastRefresh?: DateTime
}

export interface OffersStateSuccess {
  readonly state: 'success'
  offers: OfferInfo[]
  lastRefresh: DateTime
}

export type OffersState =
  | OffersStateLoading
  | OffersStateFail
  | OffersStateInitial
  | OffersStateSuccess

// TODO cache and stuff
export const offerStateAtom = atom<OffersState>({state: 'initial'})
export const offersAtom = atom((get) => {
  const state = get(offerStateAtom)
  if (state.state !== 'initial') {
    return state.offers ?? null
  }
  return null
})

export function useRefreshOffers(): () => void {
  const setOfferState = useSetAtom(offerStateAtom)
  const session = useSessionAssumeLoggedIn()
  const api = usePrivateApiAssumeLoggedIn()

  return useCallback(() => {
    console.log('💫 Refreshing offers')
    setOfferState((prev) => ({...prev, state: 'loading'}))
    void pipe(
      fetchAndDecryptOffers(api.offer, session.sessionCredentials),
      TE.match(
        (left) => {
          console.log('😡 Error while refreshing offers', left.error)
          setOfferState((prev) => ({
            ...prev,
            state: 'fail',
            fetchingError: left,
          }))
        },
        (offers) => {
          console.log('🦾 🔑 Offers fetched and decrypted')
          setOfferState({
            state: 'success',
            lastRefresh: DateTime.local(),
            offers,
          })
        }
      )
    )()
  }, [setOfferState, session, api])
}

export function useOfferState(): OffersState {
  return useAtomValue(offerStateAtom)
}

export function createSingleOfferAtom(offerId: string): Atom<OfferInfo | null> {
  return atom((get) => {
    return get(offersAtom)?.find((o) => o.offerId === offerId) ?? null
  })
}

export function useSingleOffer(offerId: string): OfferInfo | null {
  const singleOfferAtom = useMemo(
    () => createSingleOfferAtom(offerId),
    [offerId]
  )
  return useAtomValue(singleOfferAtom)
}

const buyOffersAtom = atom(
  (get) => get(offersAtom)?.filter((o) => o.offerType === 'BUY') ?? null
)

const sellOffersAtom = atom(
  (get) => get(offersAtom)?.filter((o) => o.offerType === 'SELL') ?? null
)
export function useOffersWithType(type: 'sell' | 'buy'): OfferInfo[] | null {
  return useAtomValue(type === 'buy' ? buyOffersAtom : sellOffersAtom)
}
