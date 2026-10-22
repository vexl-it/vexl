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

// A scan stops after a whole batch of unused indexes. The counter continues a
// margin smaller than the batch past the last used index, so a key allocated
// after a restore is always found by the next one.
export const INBOX_SCAN_BATCH_SIZE =
  MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST
const INBOX_COUNTER_MARGIN = 100
// Failed club joins burn indexes, so a batch has to span a run of them.
export const CLUB_SCAN_BATCH_SIZE = 20
const CLUB_COUNTER_MARGIN = 10
const CLUB_SCAN_CONCURRENCY = 5
const DERIVE_CHUNK_SIZE = 5

export interface ScanResult<A> {
  readonly found: readonly A[]
  // The margin covers keys of deleted inboxes or failed club joins past the
  // last found one, which must never be handed out again.
  readonly nextIndex: KeyDerivationIndex
}

// Effect yields on microtasks, which never let React Native render. A timer
// break before every few keys keeps the UI responsive while they are derived.
const deriveWithBreaks = <K>(
  indexes: readonly KeyDerivationIndex[],
  derive: (index: KeyDerivationIndex) => Effect.Effect<K, CryptoError>
): Effect.Effect<K[], CryptoError> =>
  pipe(
    Array.chunksOf(indexes, DERIVE_CHUNK_SIZE),
    Effect.forEach((chunk) =>
      Effect.zipRight(Effect.sleep(0), Effect.forEach(chunk, derive))
    ),
    Effect.map(Array.flatten)
  )

// Derives keys in consecutive batches and stops after a batch without a hit.
// `findExisting` answers for each key of the batch, in order.
export const scanDerivedKeys = <K, A, E>({
  batchSize,
  margin,
  derive,
  findExisting,
}: {
  batchSize: number
  margin: number
  derive: (index: KeyDerivationIndex) => Effect.Effect<K, CryptoError>
  findExisting: (
    batch: readonly K[]
  ) => Effect.Effect<ReadonlyArray<Option.Option<A>>, E>
}): Effect.Effect<ScanResult<A>, E | CryptoError> => {
  const scanFrom = (
    start: number,
    found: readonly A[],
    nextIndex: number
  ): Effect.Effect<ScanResult<A>, E | CryptoError> =>
    pipe(
      Array.makeBy(batchSize, (i) => KeyDerivationIndex.make(start + i)),
      (indexes) => deriveWithBreaks(indexes, derive),
      Effect.flatMap(findExisting),
      Effect.flatMap((answers) =>
        pipe(
          Array.findLastIndex(answers, Option.isSome),
          Option.match({
            onNone: () =>
              Effect.succeed({
                found,
                nextIndex: KeyDerivationIndex.make(nextIndex),
              }),
            onSome: (lastHit) =>
              scanFrom(
                start + batchSize,
                [...found, ...Array.getSomes(answers)],
                start + lastHit + 1 + margin
              ),
          })
        )
      )
    )

  return scanFrom(0, [], margin)
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
    margin: INBOX_COUNTER_MARGIN,
    derive: (index) => deriveInboxPrivateKey(masterSeed, index),
    findExisting: (keys) =>
      chatApi
        .checkInboxesExist({
          publicKeys: Array.map(keys, (key) => key.publicKeyPemBase64),
        })
        .pipe(
          Effect.map(({existingPublicKeys}) => {
            const existing = HashSet.fromIterable(existingPublicKeys)
            return Array.map(keys, (key) =>
              HashSet.has(existing, key.publicKeyPemBase64)
                ? Option.some(key)
                : Option.none()
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
    margin: CLUB_COUNTER_MARGIN,
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
        )
      ),
  })
