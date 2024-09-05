import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  type OfferId,
  type OfferInfoE,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, type Either} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {type ExtractRightFromEffect} from '../utils/ExtractLeft'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'

export type ApiErrorWhileFetchingOffers = ExtractRightFromEffect<
  ReturnType<OfferApi['getOffersByIds']>
>

export default function getOffersByIdsAndDecrypt({
  ids,
  offersApi,
  keyPair,
}: {
  ids: OfferId[]
  offersApi: OfferApi
  keyPair: PrivateKeyHolderE
}): Effect.Effect<
  Array<
    Either.Either<
      OfferInfoE,
      ErrorDecryptingOffer | NonCompatibleOfferVersionError
    >
  >,
  ApiErrorWhileFetchingOffers
> {
  const decrypt = flow(decryptOffer(keyPair), taskEitherToEffect)

  return offersApi
    .getOffersByIds({query: {ids}})
    .pipe(
      Effect.flatMap(
        flow(Array.map(decrypt), Array.map(Effect.either), Effect.all)
      )
    )
}
