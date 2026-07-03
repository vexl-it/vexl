import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, HashMap, HashSet, Option, Schema} from 'effect'
import {type ConnectionsInfoForOffer} from '../../offers/utils/fetchContactsForOffer'
import {keys} from '../../utils/keys'
import {type NotePrivatePayloadToEncrypt} from './encryptNotePrivatePart'

export class NotePrivatePayloadsConstructionError extends Schema.TaggedError<NotePrivatePayloadsConstructionError>(
  'NotePrivatePayloadsConstructionError'
)('NotePrivatePayloadsConstructionError', {
  message: Schema.optional(Schema.String),
  cause: Schema.Unknown,
}) {}

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

// Note fan-out mirrors offer fan-out (constructPrivatePayloads) but has no clubs
// and no verified-friends notion.
export default function constructNotePrivatePayloads({
  connectionsInfo: {
    firstDegreeConnections,
    secondDegreeConnections,
    commonFriends,
  },
  symmetricKey,
}: {
  connectionsInfo: ConnectionsInfoForOffer
  symmetricKey: SymmetricKey
}): Effect.Effect<
  readonly NotePrivatePayloadToEncrypt[],
  NotePrivatePayloadsConstructionError
> {
  return Effect.try({
    try: () => {
      const friendLevel: Record<
        PublicKeyPemBase64 | PublicKeyV2,
        HashSet.HashSet<'FIRST_DEGREE' | 'SECOND_DEGREE'>
      > = {}

      for (const firstDegreeFriendPublicKey of firstDegreeConnections) {
        addOrCreate(friendLevel, firstDegreeFriendPublicKey, 'FIRST_DEGREE')
      }

      for (const secondDegreeFriendPublicKey of secondDegreeConnections) {
        if (!friendLevel[secondDegreeFriendPublicKey])
          addOrCreate(friendLevel, secondDegreeFriendPublicKey, 'SECOND_DEGREE')
      }

      return keys(friendLevel).map((toPublicKey) => {
        const friendLevelValue = friendLevel[toPublicKey] ?? HashSet.make()

        return {
          toPublicKey,
          payloadPrivate: {
            commonFriends: Option.getOrElse(
              HashMap.get(commonFriends, toPublicKey),
              () => []
            ),
            friendLevel: Array.fromIterable(friendLevelValue),
            symmetricKey,
            viaRepost: false,
          },
        }
      })
    },
    catch: (e) =>
      new NotePrivatePayloadsConstructionError({
        message: 'Failed to construct note private parts',
        cause: e,
      }),
  })
}
