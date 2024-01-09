import {
  type OfferId,
  type OfferInfo,
} from '@vexl-next/domain/src/general/offers'
import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {flow, pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import type * as E from 'fp-ts/Either'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import {type ExtractLeftTE} from '../utils/ExtractLeft'

export type ApiErrorWhileFetchingOffers = ExtractLeftTE<
  ReturnType<OfferPrivateApi['getOffersByIds']>
>

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
  Array<
    E.Either<ErrorDecryptingOffer | NonCompatibleOfferVersionError, OfferInfo>
  >
> {
  return pipe(
    offerApi.getOffersByIds({ids}),
    TE.chainW(
      flow(
        A.map(decryptOffer(keyPair)),
        A.sequence(T.ApplicativePar),
        TE.fromTask
      )
    )
  )
}
