import {
  generateMasterSeed as generateMasterSeedBytes,
  MASTER_SEED_LENGTH,
} from '@vexl-next/cryptography/src/operations/keyDerivation'
import {Schema} from 'effect'
import {generateUuid} from '../utility/Uuid.brand'

export const MasterSeed = Schema.String.pipe(
  Schema.pattern(new RegExp(`^[0-9a-f]{${MASTER_SEED_LENGTH * 2}}$`)),
  Schema.brand('MasterSeed')
)
export type MasterSeed = typeof MasterSeed.Type

export const generateMasterSeed = (): MasterSeed =>
  Schema.decodeSync(MasterSeed)(
    Buffer.from(generateMasterSeedBytes()).toString('hex')
  )

export const masterSeedToBytes = (masterSeed: MasterSeed): Uint8Array =>
  Buffer.from(masterSeed, 'hex')

export const KeyDerivationIndex = Schema.NonNegativeInt.pipe(
  Schema.brand('KeyDerivationIndex')
)
export type KeyDerivationIndex = typeof KeyDerivationIndex.Type

// Random, so no stale backup or lost counter can hand out a used one again
export const KeyDerivationId = Schema.UUID.pipe(Schema.brand('KeyDerivationId'))
export type KeyDerivationId = typeof KeyDerivationId.Type

export const generateKeyDerivationId = (): KeyDerivationId =>
  Schema.decodeSync(KeyDerivationId)(generateUuid())
