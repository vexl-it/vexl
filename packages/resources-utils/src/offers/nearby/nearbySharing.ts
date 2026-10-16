import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NearbyOfferKey,
  type OfferAdminId,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect} from 'effect'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from '../utils/encryptPrivatePart'
import {generateNearbyKey, nearbyKeyToKeyPair} from './nearbyKey'

// Owner keys are generated locally, so failing to derive the key pair is a defect
const nearbyPublicKey = (
  nearbyKey: NearbyOfferKey
): Effect.Effect<PublicKeyPemBase64> =>
  Effect.sync(() => nearbyKeyToKeyPair(nearbyKey).publicKeyPemBase64)

export function uploadNearbyPrivatePart({
  offerApi,
  adminId,
  symmetricKey,
  nearbyKey,
}: {
  offerApi: OfferApi
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
  nearbyKey: NearbyOfferKey
}): Effect.Effect<
  void,
  | PrivatePartEncryptionError
  | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
> {
  return Effect.gen(function* (_) {
    const privatePart = yield* _(
      encryptPrivatePart({
        toPublicKey: yield* _(nearbyPublicKey(nearbyKey)),
        payloadPrivate: {
          commonFriends: [],
          verifiedCommonFriends: [],
          friendLevel: ['NEARBY'],
          symmetricKey,
          clubIds: [],
        },
      })
    )
    yield* _(
      offerApi.createPrivatePart({adminId, offerPrivateList: [privatePart]})
    )
  })
}

export function enableNearbySharing({
  offerApi,
  adminId,
  symmetricKey,
}: {
  offerApi: OfferApi
  adminId: OfferAdminId
  symmetricKey: SymmetricKey
}): Effect.Effect<
  NearbyOfferKey,
  Effect.Effect.Error<ReturnType<typeof uploadNearbyPrivatePart>>
> {
  const nearbyKey = generateNearbyKey()
  return uploadNearbyPrivatePart({
    offerApi,
    adminId,
    symmetricKey,
    nearbyKey,
  }).pipe(Effect.as(nearbyKey))
}

export function disableNearbySharing({
  offerApi,
  adminId,
  nearbyKey,
}: {
  offerApi: OfferApi
  adminId: OfferAdminId
  nearbyKey: NearbyOfferKey
}): Effect.Effect<
  void,
  Effect.Effect.Error<ReturnType<OfferApi['deletePrivatePart']>>
> {
  return nearbyPublicKey(nearbyKey).pipe(
    Effect.flatMap((publicKey) =>
      offerApi.deletePrivatePart({
        adminIds: [adminId],
        publicKeys: [publicKey],
      })
    ),
    Effect.asVoid
  )
}
