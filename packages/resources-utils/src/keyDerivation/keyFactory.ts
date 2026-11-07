import {
  type KeyPairV2,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  deriveBytes,
  deriveChatRecoveryProof as deriveChatRecoveryProofFromBytes,
  deriveKeyPairV2,
  derivePrivateKeyHolder,
} from '@vexl-next/cryptography/src/operations/keyDerivation'
import {type ClubKeys} from '@vexl-next/domain/src/general/clubs'
import {
  masterSeedToBytes,
  type KeyDerivationIndex,
  type MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {ChatRecoveryProof} from '@vexl-next/domain/src/general/messaging'
import {NoteRepostId, type NoteId} from '@vexl-next/domain/src/general/notes'
import {CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect'

const derivePrivateKeyHolderE = (
  masterSeed: MasterSeed,
  path: string
): Effect.Effect<PrivateKeyHolder, CryptoError> =>
  Effect.try({
    try: () => derivePrivateKeyHolder(masterSeedToBytes(masterSeed), path),
    catch: (error) =>
      new CryptoError({message: 'Failed to derive V1 key', error}),
  })

const deriveKeyPairV2E = (
  masterSeed: MasterSeed,
  path: string
): Effect.Effect<KeyPairV2, CryptoError> =>
  Effect.tryPromise({
    try: async () => await deriveKeyPairV2(masterSeedToBytes(masterSeed), path),
    catch: (error) =>
      new CryptoError({message: 'Failed to derive V2 keypair', error}),
  })

export const deriveIdentityPrivateKey = (
  masterSeed: MasterSeed
): Effect.Effect<PrivateKeyHolder, CryptoError> =>
  derivePrivateKeyHolderE(masterSeed, 'identity/v1')

export const deriveIdentityKeyPairV2 = (
  masterSeed: MasterSeed
): Effect.Effect<KeyPairV2, CryptoError> =>
  deriveKeyPairV2E(masterSeed, 'identity/v2')

export const deriveInboxPrivateKey = (
  masterSeed: MasterSeed,
  index: KeyDerivationIndex
): Effect.Effect<PrivateKeyHolder, CryptoError> =>
  derivePrivateKeyHolderE(masterSeed, `inbox/${index}`)

export const deriveClubKeys = (
  masterSeed: MasterSeed,
  index: KeyDerivationIndex
): Effect.Effect<ClubKeys, CryptoError> =>
  Effect.all({
    keyPair: deriveKeyPairV2E(masterSeed, `club/${index}`),
    oldKeyPair: derivePrivateKeyHolderE(masterSeed, `club/${index}`),
  })

// Formats the derived bytes as an RFC 4122 v4 UUID.
export const deriveNoteRepostId = (
  masterSeed: MasterSeed,
  noteId: NoteId
): NoteRepostId => {
  const bytes = Buffer.from(
    deriveBytes(masterSeedToBytes(masterSeed), `repost/${noteId}`, 16)
  )
  bytes.writeUInt8((bytes.readUInt8(6) & 0x0f) | 0x40, 6)
  bytes.writeUInt8((bytes.readUInt8(8) & 0x3f) | 0x80, 8)
  const hex = bytes.toString('hex')

  return Schema.decodeSync(NoteRepostId)(
    [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-')
  )
}

export const deriveChatRecoveryProof = (
  masterSeed: MasterSeed,
  keys: {
    myPublicKey: PublicKeyPemBase64
    otherSidePublicKey: PublicKeyPemBase64
  }
): ChatRecoveryProof =>
  ChatRecoveryProof.make(
    deriveChatRecoveryProofFromBytes(masterSeedToBytes(masterSeed), keys)
  )
