import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubKeys, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {KeyDerivationIndex} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  type BackupFile,
  type BackupNotificationSecret,
  type BackupUserData,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {
  deriveClubKeys,
  deriveInboxPrivateKey,
} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {Array, Effect, HashSet, pipe, Record, Struct} from 'effect'
import {type SessionV2} from '../../brands/Session.brand'
import {type KeyDerivationCounters} from '../keyDerivation'

const derivedPublicKeys = <A>(
  count: KeyDerivationIndex,
  derive: (index: KeyDerivationIndex) => Effect.Effect<A, CryptoError>,
  toPublicKey: (derived: A) => PublicKeyPemBase64
): Effect.Effect<HashSet.HashSet<PublicKeyPemBase64>, CryptoError> =>
  pipe(
    // Array.makeBy always creates at least one element.
    count === 0 ? [] : Array.makeBy(count, (i) => KeyDerivationIndex.make(i)),
    Effect.forEach(derive),
    Effect.map((derived) =>
      HashSet.fromIterable(Array.map(derived, toPublicKey))
    )
  )

// Legacy keys are the random ones created before the master seed existed.
// Anything not matching a derived key is treated as legacy, so a key is only
// ever over-included, never missed.
export const createBackupFile = ({
  session,
  counters,
  inboxKeys,
  clubs,
  clubKeysWaitingForAdmission,
  realUserData,
  notificationSecret,
}: {
  session: SessionV2
  realUserData?: BackupUserData
  notificationSecret?: BackupNotificationSecret
  counters: KeyDerivationCounters
  inboxKeys: readonly PrivateKeyHolder[]
  clubs: Record.ReadonlyRecord<ClubUuid, ClubKeys>
  clubKeysWaitingForAdmission: readonly ClubKeys[]
}): Effect.Effect<BackupFile, CryptoError> =>
  Effect.gen(function* () {
    const {masterSeed} = session
    const derivedInboxPublicKeys = yield* derivedPublicKeys(
      counters.nextInboxIndex,
      (index) => deriveInboxPrivateKey(masterSeed, index),
      (key) => key.publicKeyPemBase64
    )
    const derivedClubPublicKeys = yield* derivedPublicKeys(
      counters.nextClubIndex,
      (index) => deriveClubKeys(masterSeed, index),
      (keys) => keys.oldKeyPair.publicKeyPemBase64
    )
    const isLegacyClubKey = (keys: ClubKeys): boolean =>
      !HashSet.has(derivedClubPublicKeys, keys.oldKeyPair.publicKeyPemBase64)

    return {
      version: 1,
      session: {
        ...Struct.pick(
          session,
          'phoneNumber',
          'sessionCredentials',
          'privateKey',
          'keyPairV2',
          'isLiquidityProvider'
        ),
        realUserData,
      },
      masterSeed,
      legacyInboxKeys: pipe(
        inboxKeys,
        Array.filter(
          (key) =>
            key.publicKeyPemBase64 !== session.privateKey.publicKeyPemBase64 &&
            !HashSet.has(derivedInboxPublicKeys, key.publicKeyPemBase64)
        ),
        Array.dedupeWith(
          (a, b) => a.publicKeyPemBase64 === b.publicKeyPemBase64
        )
      ),
      legacyClubKeys: Record.filter(clubs, isLegacyClubKey),
      notificationSecret,
      legacyClubKeysWaitingForAdmission: Array.filter(
        clubKeysWaitingForAdmission,
        isLegacyClubKey
      ),
    } satisfies BackupFile
  })
