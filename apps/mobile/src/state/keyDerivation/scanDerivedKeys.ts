import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  KeyDerivationIndex,
  type MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST} from '@vexl-next/rest-api/src/services/chat/contracts'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, HashSet, Option, pipe} from 'effect'

export const INBOX_SCAN_BATCH_SIZE =
  MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST
// Failed club joins burn indexes, so a batch has to span a run of them.
export const CLUB_SCAN_BATCH_SIZE = 20
const CLUB_SCAN_CONCURRENCY = 5

export interface ScanResult<A> {
  readonly found: readonly A[]
  // Every scanned index counts as used - a key of a deleted inbox or a failed
  // club join must never be handed out again.
  readonly nextIndex: KeyDerivationIndex
}

// Derives keys in consecutive batches and stops after a batch without a hit.
export const scanDerivedKeys = <K, A, E>({
  batchSize,
  derive,
  findExisting,
}: {
  batchSize: number
  derive: (index: KeyDerivationIndex) => Effect.Effect<K, CryptoError>
  findExisting: (batch: readonly K[]) => Effect.Effect<readonly A[], E>
}): Effect.Effect<ScanResult<A>, E | CryptoError> => {
  const scanFrom = (
    start: number,
    found: readonly A[]
  ): Effect.Effect<ScanResult<A>, E | CryptoError> =>
    pipe(
      Array.makeBy(batchSize, (i) => KeyDerivationIndex.make(start + i)),
      Effect.forEach(derive),
      Effect.flatMap(findExisting),
      Effect.flatMap((hits) =>
        Array.isNonEmptyReadonlyArray(hits)
          ? scanFrom(start + batchSize, [...found, ...hits])
          : Effect.succeed({
              found,
              nextIndex: KeyDerivationIndex.make(start + batchSize),
            })
      )
    )

  return scanFrom(0, [])
}

export const scanInboxes = ({
  masterSeed,
  chatApi,
}: {
  masterSeed: MasterSeed
  chatApi: Pick<ChatApi, 'checkInboxesExist'>
}): Effect.Effect<
  ScanResult<PrivateKeyHolder>,
  Effect.Effect.Error<ReturnType<ChatApi['checkInboxesExist']>> | CryptoError
> =>
  scanDerivedKeys({
    batchSize: INBOX_SCAN_BATCH_SIZE,
    derive: (index) => deriveInboxPrivateKey(masterSeed, index),
    findExisting: (keys) =>
      chatApi
        .checkInboxesExist({
          publicKeys: Array.map(keys, (key) => key.publicKeyPemBase64),
        })
        .pipe(
          Effect.map(({existingPublicKeys}) => {
            const existing = HashSet.fromIterable(existingPublicKeys)
            return Array.filter(keys, (key) =>
              HashSet.has(existing, key.publicKeyPemBase64)
            )
          })
        ),
  })

export interface FoundClub {
  readonly clubUuid: ClubUuid
  readonly keys: ClubKeys
}

// None when the keys are not a member of any (active) club.
export const findClubUuidOfMember =
  ({
    contactApi,
    notificationToken,
  }: {
    contactApi: ContactApi
    notificationToken: Option.Option<ExpoNotificationToken>
  }) =>
  (keys: ClubKeys) =>
    contactApi
      .getClubInfo({
        keyPair: keys.oldKeyPair,
        keyPairV2: keys.keyPair,
        notificationToken,
        vexlNotificationToken: Option.none(),
      })
      .pipe(
        Effect.map(({clubInfoForUser}) =>
          Option.some(clubInfoForUser.club.uuid)
        ),
        Effect.catchTag('NotFoundError', () => Effect.succeedNone)
      )

export const scanClubs = <E>({
  masterSeed,
  findClubUuid,
}: {
  masterSeed: MasterSeed
  findClubUuid: (keys: ClubKeys) => Effect.Effect<Option.Option<ClubUuid>, E>
}): Effect.Effect<ScanResult<FoundClub>, E | CryptoError> =>
  scanDerivedKeys({
    batchSize: CLUB_SCAN_BATCH_SIZE,
    derive: (index) => deriveClubKeys(masterSeed, index),
    findExisting: (batch) =>
      pipe(
        batch,
        Effect.forEach(
          (keys) =>
            Effect.map(
              findClubUuid(keys),
              Option.map((clubUuid) => ({clubUuid, keys}))
            ),
          {concurrency: CLUB_SCAN_CONCURRENCY}
        ),
        Effect.map(Array.getSomes)
      ),
  })
