import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type OfferInfoE} from '@vexl-next/domain/src/general/offers'
import {type IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, type Either} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'

export type ApiErrorFetchingOffers = Effect.Effect.Error<
  ReturnType<OfferApi['getOffersForMeModifiedOrCreatedAfter']>
>

/**
 * Downloads new offers from the server and decrypts them with provided keypair
 */
export default function getNewOffersAndDecrypt({
  offersApi,
  keyPair,
  modifiedAt,
}: {
  /**
   * Offers API instance. Already handles auth for us.
   */
  offersApi: OfferApi
  /**
   * KeyPair to decrypt offers with.
   */
  keyPair: PrivateKeyHolderE
  /**
   * Only offers modified/created after this date will be fetched.
   */
  modifiedAt: IsoDatetimeStringE
}): Effect.Effect<
  Array<
    Either.Either<
      OfferInfoE,
      ErrorDecryptingOffer | NonCompatibleOfferVersionError
    >
  >,
  ApiErrorFetchingOffers
> {
  const decrypt = flow(decryptOffer(keyPair), taskEitherToEffect)

  return offersApi
    .getOffersForMeModifiedOrCreatedAfter({query: {modifiedAt}})
    .pipe(
      Effect.map(({offers}) => offers),
      Effect.flatMap(
        flow(Array.map(decrypt), Array.map(Effect.either), Effect.all)
      )
    )
}
