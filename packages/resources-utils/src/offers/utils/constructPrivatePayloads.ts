import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  OfferPrivatePart,
  OfferPrivatePartE,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {Effect, Schema} from 'effect'
import {z} from 'zod'
import {keys} from '../../utils/keys'
import {type ConnectionsInfoForOffer} from './fetchContactsForOffer'

export class PrivatePayloadsConstructionError extends Schema.TaggedError<PrivatePayloadsConstructionError>(
  'PrivatePayloadsConstructionError'
)('PrivatePayloadsConstructionError', {
  message: Schema.optional(Schema.String),
  cause: Schema.Unknown,
}) {}

export const OfferPrivatePayloadToEncrypt = z
  .object({
    toPublicKey: PublicKeyPemBase64,
    payloadPrivate: OfferPrivatePart,
  })
  .readonly()
export type OfferPrivatePayloadToEncrypt = z.TypeOf<
  typeof OfferPrivatePayloadToEncrypt
>

export const OfferPrivatePayloadToEncryptE = Schema.Struct({
  toPublicKey: PublicKeyPemBase64E,
  payloadPrivate: OfferPrivatePartE,
})
export type OfferPrivatePayloadToEncryptE =
  typeof OfferPrivatePayloadToEncryptE.Type

// TODO test this function
export default function constructPrivatePayloads({
  connectionsInfo: {
    firstDegreeConnections,
    secondDegreeConnections,
    commonFriends,
  },
  clubsConnections,
  symmetricKey,
}: {
  connectionsInfo: ConnectionsInfoForOffer
  clubsConnections: PublicKeyPemBase64[]
  symmetricKey: SymmetricKey
}): Effect.Effect<
  OfferPrivatePayloadToEncrypt[],
  PrivatePayloadsConstructionError
> {
  return Effect.try({
    try: () => {
      // First we need to find out friend levels for each connection.
      // We can do that by iterating over firstDegreeFriends and secondDegreeFriends
      const friendLevel: Record<
        PublicKeyPemBase64,
        Set<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'>
      > = {}
      for (const firstDegreeFriendPublicKey of firstDegreeConnections) {
        friendLevel[firstDegreeFriendPublicKey] = new Set(['FIRST_DEGREE'])
      }

      // There are duplicities. That is why all these shinanigans with Set
      for (const secondDegreeFriendPublicKey of secondDegreeConnections) {
        if (!friendLevel[secondDegreeFriendPublicKey])
          friendLevel[secondDegreeFriendPublicKey] = new Set(['SECOND_DEGREE'])
        else friendLevel[secondDegreeFriendPublicKey]?.add('SECOND_DEGREE')
      }

      // There will be no duplicates but to keep code consistent
      for (const clubFriendPublicKey of clubsConnections) {
        if (!friendLevel[clubFriendPublicKey])
          friendLevel[clubFriendPublicKey] = new Set(['CLUB'])
        else friendLevel[clubFriendPublicKey]?.add('CLUB')
      }

      return keys(friendLevel).map((key) => {
        const friendLevelValue = friendLevel[key]
        return {
          toPublicKey: key,
          payloadPrivate: {
            commonFriends: !friendLevelValue?.has('CLUB')
              ? (commonFriends.commonContacts.find(
                  (one) => one.publicKey === key
                )?.common?.hashes ?? [])
              : [],
            friendLevel: friendLevelValue ? Array.from(friendLevelValue) : [],
            symmetricKey,
          },
        }
      })
    },
    catch: (e) =>
      new PrivatePayloadsConstructionError({
        message: 'Failed to construct private parts',
        cause: e,
      }),
  })
}
