import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder'
import {type OfferInfoE} from '@vexl-next/domain/src/general/offers'
import {type IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, type Either} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'

export type ApiErrorFetchingClubsOffers = Effect.Effect.Error<
  ReturnType<OfferApi['getClubOffersForMeModifiedOrCreatedAfter']>
>

export default function getNewClubsOffersAndDecrypt({
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
      DecryptingOfferError | NonCompatibleOfferVersionError
    >
  >,
  ApiErrorFetchingClubsOffers | CryptoError
> {
  return Effect.gen(function* (_) {
    const challenge = yield* _(
      offersApi.createChallenge({publicKey: keyPair.publicKeyPemBase64})
    )

    const signedChallenge = yield* _(
      ecdsaSignE(keyPair.privateKeyPemBase64)(challenge.challenge)
    )

    return yield* _(
      offersApi
        .getClubOffersForMeModifiedOrCreatedAfter({
          body: {
            modifiedAt,
            publicKey: keyPair.publicKeyPemBase64,
            signedChallenge: {
              challenge: challenge.challenge,
              signature: signedChallenge,
            },
          },
        })
        .pipe(
          Effect.map(({offers}) => offers),
          Effect.flatMap(
            flow(
              Array.map(decryptOffer(keyPair)),
              Array.map(Effect.either),
              Effect.all
            )
          )
        )
    )
  })
}
