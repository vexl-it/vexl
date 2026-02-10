import {
  type KeyPairV2,
  KeyPairV2 as KeyPairV2Schema,
} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import * as cryptobox from '@vexl-next/cryptography/src/operations/cryptobox'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Array, Effect, Option, Schema, Struct} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

// Schema for club V2 keys storage - map of clubUuid to keypair
const ClubV2KeysStorage = Schema.Struct({
  // Record of ClubUuid -> KeyPairV2
  data: Schema.Record({key: ClubUuid, value: KeyPairV2Schema}),
})
type ClubV2KeysStorage = typeof ClubV2KeysStorage.Type

// MMKV storage atom for club V2 keys
export const clubV2KeysStorageAtom = atomWithParsedMmkvStorage(
  'clubV2Keys',
  {data: {}},
  ClubV2KeysStorage,
  'clubV2Keys'
)

// Focused atom for just the data map
export const clubV2KeysAtom = focusAtom(clubV2KeysStorageAtom, (o) =>
  o.prop('data')
)

/**
 * Error thrown when club V2 key generation fails
 */
export class ClubV2KeyGenerationError extends Error {
  readonly _tag = 'ClubV2KeyGenerationError'
  constructor(
    public readonly clubUuid: ClubUuid,
    message: string,
    cause?: unknown
  ) {
    super(message, {cause})
    this.name = 'ClubV2KeyGenerationError'
  }
}

/**
 * Generates and stores a V2 keypair for a specific club.
 * Called when joining a club.
 *
 * @param clubUuid - The club to generate keys for
 * @returns The generated keypair
 */
export function generateClubV2KeyPair(
  clubUuid: ClubUuid
): Effect.Effect<KeyPairV2, ClubV2KeyGenerationError> {
  return Effect.gen(function* () {
    yield* Effect.log(`Generating V2 keypair for club ${clubUuid}`)

    // Generate new keypair
    const keypair = yield* Effect.tryPromise({
      try: () => cryptobox.generateKeyPair(),
      catch: (e) =>
        new ClubV2KeyGenerationError(
          clubUuid,
          'Failed to generate club V2 keypair',
          e
        ),
    })

    // Store in MMKV
    const store = getDefaultStore()
    store.set(clubV2KeysAtom, (prev) => ({
      ...prev,
      [clubUuid]: keypair,
    }))

    yield* Effect.log(`V2 keypair generated and stored for club ${clubUuid}`)

    return keypair
  })
}

/**
 * Gets the V2 keypair for a specific club if it exists.
 */
export function getClubV2KeyPair(clubUuid: ClubUuid): Option.Option<KeyPairV2> {
  const store = getDefaultStore()
  const data = store.get(clubV2KeysAtom)
  const keypair = data[clubUuid]
  return keypair ? Option.some(keypair) : Option.none()
}

/**
 * Removes the V2 keypair for a specific club.
 * Called when leaving a club.
 */
export function removeClubV2KeyPair(clubUuid: ClubUuid): void {
  const store = getDefaultStore()
  store.set(clubV2KeysAtom, (prev) => Struct.omit(clubUuid)(prev))
}

/**
 * Action atom to remove club V2 keys (mirrors removeClubFromKeyHolderStateActionAtom)
 */
export const removeClubV2KeysActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(clubV2KeysAtom, (data) => Struct.omit(clubUuid)(data))
  }
)

/**
 * Ensures V2 keys exist for all clubs the user is a member of.
 * Called during session load to migrate existing club memberships.
 *
 * @param clubUuids - List of club UUIDs the user belongs to
 * @returns List of clubs that got new V2 keys (for sync to backend)
 */
export function ensureClubV2KeysExist(
  clubUuids: readonly ClubUuid[]
): Effect.Effect<
  Array<{clubUuid: ClubUuid; keypair: KeyPairV2}>,
  ClubV2KeyGenerationError
> {
  return Effect.gen(function* () {
    const store = getDefaultStore()
    const existingKeys = store.get(clubV2KeysAtom)
    const newKeys: Array<{clubUuid: ClubUuid; keypair: KeyPairV2}> = []

    for (const clubUuid of clubUuids) {
      if (existingKeys[clubUuid]) {
        // Key already exists, skip
        continue
      }

      // Generate new key for this club
      const keypair = yield* generateClubV2KeyPair(clubUuid)
      newKeys.push({clubUuid, keypair})
    }

    if (Array.isNonEmptyArray(newKeys)) {
      yield* Effect.log(
        `Generated V2 keys for ${newKeys.length} existing clubs`
      )
    }

    return newKeys
  })
}

/**
 * Gets all club V2 keypairs as a Record.
 */
export function getAllClubV2KeyPairs(): Record<ClubUuid, KeyPairV2> {
  return getDefaultStore().get(clubV2KeysAtom)
}
