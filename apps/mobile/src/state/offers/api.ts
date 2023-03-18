import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import {decryptOffer} from './utils'
import {type OfferInfo} from '@vexl-next/domain/dist/general/OfferInfo'
import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type PrivateKey} from '@vexl-next/cryptography'

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
  sessionPrivateKey: PrivateKey
): TE.TaskEither<OfferFetchingError | OfferDecryptionError, OfferInfo[]> {
  return pipe(
    offerApi.getOffersForMe(),
    TE.mapLeft((error) => ({_tag: 'OfferFetchingError', error} as const)),
    TE.map((r) => r.offers),
    // TODO How to do this better?
    TE.chainW(A.traverse(TE.taskEither)(decryptOffer(sessionPrivateKey))),
    TE.mapLeft((error) => ({_tag: 'OfferDecryptingError', error} as const))
  )
}
