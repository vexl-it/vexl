import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  KeyDerivationIndex,
  type MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST} from '@vexl-next/rest-api/src/services/chat/contracts'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, HashSet, Option, pipe} from 'effect'

// A scan stops after two whole batches of unused indexes. The counter continues
// a margin smaller than a batch past the last used index, so a key allocated
// after a restore is always found by the next one.
export const INBOX_SCAN_BATCH_SIZE =
  MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST
const INBOX_COUNTER_MARGIN = 100
// A join whose request failed still burns its index, so a batch has to span
// a run of them.
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
export const deriveWithBreaks = <K>(
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

const EMPTY_BATCHES_TO_STOP = 2

// Derives keys in consecutive batches and stops after `EMPTY_BATCHES_TO_STOP`
// batches in a row without a hit, but not before `scanAtLeastTo`.
// `findExisting` answers for each key of the batch, in order.
export const scanDerivedKeys = <K, A, E>({
  batchSize,
  margin,
  scanAtLeastTo = 0,
  derive,
  findExisting,
}: {
  batchSize: number
  margin: number
  scanAtLeastTo?: number
  derive: (index: KeyDerivationIndex) => Effect.Effect<K, CryptoError>
  findExisting: (
    batch: readonly K[]
  ) => Effect.Effect<ReadonlyArray<Option.Option<A>>, E>
}): Effect.Effect<ScanResult<A>, E | CryptoError> => {
  const scanFrom = ({
    start,
    found,
    nextIndex,
    emptyBatches,
  }: {
    start: number
    found: readonly A[]
    nextIndex: number
    emptyBatches: number
  }): Effect.Effect<ScanResult<A>, E | CryptoError> =>
    pipe(
      Array.makeBy(batchSize, (i) => KeyDerivationIndex.make(start + i)),
      (indexes) => deriveWithBreaks(indexes, derive),
      Effect.flatMap(findExisting),
      Effect.flatMap((answers) =>
        pipe(
          Array.findLastIndex(answers, Option.isSome),
          Option.match({
            onNone: () =>
              emptyBatches + 1 >= EMPTY_BATCHES_TO_STOP &&
              start + batchSize >= scanAtLeastTo
                ? Effect.succeed({
                    found,
                    nextIndex: KeyDerivationIndex.make(
                      Math.max(nextIndex, scanAtLeastTo)
                    ),
                  })
                : scanFrom({
                    start: start + batchSize,
                    found,
                    nextIndex,
                    emptyBatches: emptyBatches + 1,
                  }),
            onSome: (lastHit) =>
              scanFrom({
                start: start + batchSize,
                found: [...found, ...Array.getSomes(answers)],
                nextIndex: start + lastHit + 1 + margin,
                emptyBatches: 0,
              }),
          })
        )
      )
    )

  return scanFrom({start: 0, found: [], nextIndex: margin, emptyBatches: 0})
}

export const scanInboxes = ({
  masterSeed,
  chatApi,
  scanAtLeastTo,
}: {
  masterSeed: MasterSeed
  chatApi: Pick<ChatApi, 'checkInboxesExist'>
  scanAtLeastTo?: number
}): Effect.Effect<
  ScanResult<PrivateKeyHolder>,
  Effect.Effect.Error<ReturnType<ChatApi['checkInboxesExist']>> | CryptoError
> =>
  scanDerivedKeys({
    batchSize: INBOX_SCAN_BATCH_SIZE,
    margin: INBOX_COUNTER_MARGIN,
    scanAtLeastTo,
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
// Read-only: no notification token is handed out while scanning.
export const findClubUuidOfMember =
  (contactApi: ContactApi) => (keys: ClubKeys) =>
    contactApi
      .getClubInfo({
        keyPair: keys.oldKeyPair,
        keyPairV2: keys.keyPair,
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
  scanAtLeastTo,
}: {
  masterSeed: MasterSeed
  findClubUuid: (keys: ClubKeys) => Effect.Effect<Option.Option<ClubUuid>, E>
  scanAtLeastTo?: number
}): Effect.Effect<ScanResult<FoundClub>, E | CryptoError> =>
  scanDerivedKeys({
    batchSize: CLUB_SCAN_BATCH_SIZE,
    margin: CLUB_COUNTER_MARGIN,
    scanAtLeastTo,
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
