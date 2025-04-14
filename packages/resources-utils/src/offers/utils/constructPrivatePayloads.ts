import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  OfferPrivatePart,
  OfferPrivatePartE,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, HashSet, Option, pipe, Record, Schema} from 'effect'
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

const addOrCreate = <K extends string, T>(
  record: Record<K, HashSet.HashSet<T>>,
  key: K,
  value: T
): void => {
  const existingValue = record[key]
  if (existingValue !== undefined) {
    record[key] = HashSet.add(existingValue, value)
  } else record[key] = HashSet.make(value)
}

// TODO test this function
export default function constructPrivatePayloads({
  connectionsInfo: {
    firstDegreeConnections,
    secondDegreeConnections,
    commonFriends,
    clubsConnections,
  },
  symmetricKey,
}: {
  connectionsInfo: ConnectionsInfoForOffer
  symmetricKey: SymmetricKey
}): Effect.Effect<
  readonly OfferPrivatePayloadToEncrypt[],
  PrivatePayloadsConstructionError
> {
  return Effect.try({
    try: () => {
      console.log('here')
      // First we need to find out friend levels for each connection.
      // We can do that by iterating over firstDegreeFriends and secondDegreeFriends
      const friendLevel: Record<
        PublicKeyPemBase64,
        HashSet.HashSet<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'>
      > = {}

      console.log('here2')
      for (const firstDegreeFriendPublicKey of firstDegreeConnections) {
        addOrCreate(friendLevel, firstDegreeFriendPublicKey, 'FIRST_DEGREE')
      }

      console.log('here3')
      // There are duplicities. That is why all these shinanigans with Set
      for (const secondDegreeFriendPublicKey of secondDegreeConnections) {
        // Do not set if already has FIRST_DEGREE
        if (!friendLevel[secondDegreeFriendPublicKey])
          addOrCreate(friendLevel, secondDegreeFriendPublicKey, 'SECOND_DEGREE')
      }

      console.log('here4')
      const allTargetPublicKeysForClubs = Array.flatten(
        Record.values(clubsConnections)
      )

      console.log('here5')
      // There will be no duplicates but to keep code consistent
      for (const clubFriendPublicKey of allTargetPublicKeysForClubs) {
        addOrCreate(friendLevel, clubFriendPublicKey, 'CLUB')
      }

      console.log('here6')
      return keys(friendLevel).map((key) => {
        const friendLevelValue = friendLevel[key] ?? HashSet.make()

        console.log('here7')
        const isFromClub = HashSet.has(friendLevelValue, 'CLUB')

        console.log('here8')
        const clubIdForKey = isFromClub
          ? pipe(
              Record.toEntries(clubsConnections),
              Array.findFirst(([_, publicKeys]) =>
                Array.contains(publicKeys, key)
              ),
              Option.map(([clubUuid]) => [clubUuid]),
              Option.getOrElse(() => [])
            )
          : []
        console.log('here9')

        return {
          toPublicKey: key,
          payloadPrivate: {
            commonFriends:
              // This is optimization. Club key does not have common friends
              !isFromClub
                ? (commonFriends.commonContacts.find(
                    (one) => one.publicKey === key
                  )?.common?.hashes ?? [])
                : [],
            friendLevel: Array.fromIterable(friendLevelValue) ?? [],
            symmetricKey,
            clubIds: clubIdForKey,
          },
        }
      })
    },
    catch: (e: any) => {
      console.log('ahahaha', e.message)
      return new PrivatePayloadsConstructionError({
        message: 'Failed to construct private parts',
        cause: e,
      })
    },
  })
}
