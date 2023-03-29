import {
  type OfferId,
  type OfferInfo,
} from '@vexl-next/domain/dist/general/offers'
import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {flow, pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import type * as E from 'fp-ts/Either'
import decryptOffer, {type ErrorDecryptingOffer} from './decryptOffer'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'

export type ApiErrorWhileFetchingOffers =
  BasicError<'ApiErrorWhileFetchingOffers'>

export default function getOffersByIdsAndDecrypt({
  ids,
  offerApi,
  keyPair,
}: {
  ids: OfferId[]
  offerApi: OfferPrivateApi
  keyPair: PrivateKeyHolder
}): TE.TaskEither<
  ApiErrorWhileFetchingOffers,
  Array<E.Either<ErrorDecryptingOffer, OfferInfo>>
> {
  return pipe(
    offerApi.getOffersByIds({ids}),
    TE.mapLeft(toError('ApiErrorWhileFetchingOffers')),
    TE.chainW(
      flow(
        A.map(decryptOffer(keyPair)),
        A.sequence(T.ApplicativePar),
        TE.fromTask
      )
    )
  )
}
