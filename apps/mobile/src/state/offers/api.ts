import {usePrivateApiAssumeLoggedIn} from '../../api'
import {pipe} from 'fp-ts/function'
import {useEffect, useState} from 'react'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import {decryptOffer} from './utils'
import {useSessionAssumeLoggedIn} from '../session'
import {type OfferInfo} from '@vexl-next/domain/dist/general/OfferInfo'
import {type UserSessionCredentials} from '@vexl-next/rest-api/dist/UserSessionCredentials.brand'
import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'

export interface FetchOffersState {
  readonly state: 'error' | 'success' | 'loading'
  readonly items?: OfferInfo[]
}

export interface OfferFetchingError {
  readonly _tag: 'OfferFetchingError'
  readonly error: unknown
}

export interface OfferDecryptionError {
  readonly _tag: 'OfferDecryptingError'
  readonly error: unknown
}

export function fetchAndDecryptOffers(
  offerApi: OfferPrivateApi,
  session: UserSessionCredentials
): TE.TaskEither<OfferFetchingError | OfferDecryptionError, OfferInfo[]> {
  return pipe(
    offerApi.getOffersForMe(),
    TE.mapLeft((error) => ({_tag: 'OfferFetchingError', error} as const)),
    TE.map((r) => r.offers),
    // TODO How to do this better?
    TE.chainW(A.traverse(TE.taskEither)(decryptOffer(session.privateKey))),
    TE.mapLeft((error) => ({_tag: 'OfferDecryptingError', error} as const))
  )
}

export function useFetchAndDecryptOffers(): FetchOffersState {
  const api = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()

  // TODO cache and or move to atom / molecule
  const [fetchState, setFetchState] = useState<FetchOffersState>({
    state: 'loading',
    items: undefined,
  })

  useEffect(() => {
    setFetchState({state: 'loading', items: undefined})
    void pipe(
      api.offer.getOffersForMe(),
      TE.map((r) => r.offers),
      TE.chainW(
        A.traverse(TE.taskEither)(
          decryptOffer(session.sessionCredentials.privateKey)
        )
      ),
      TE.match(
        (left) => {
          console.log('error', left)
          setFetchState({state: 'error', items: undefined})
        },
        (right) => {
          setFetchState({state: 'success', items: right})
        }
      )
    )()
  }, [api, session, setFetchState])

  return fetchState
}
