import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  type OfferId,
  type OfferInfoE,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, type Either} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'

export type ApiErrorWhileFetchingOffers = Effect.Effect.Error<
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
      DecryptingOfferError | NonCompatibleOfferVersionError
    >
  >,
  ApiErrorWhileFetchingOffers
> {
  return offersApi
    .getOffersByIds({query: {ids}})
    .pipe(
      Effect.flatMap(
        flow(
          Array.map(decryptOffer(keyPair)),
          Array.map(Effect.either),
          Effect.all
        )
      )
    )
}
