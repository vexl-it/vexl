import {hkdf} from '@noble/hashes/hkdf.js'
import {sha256} from '@noble/hashes/sha2.js'
import {getCrypto} from '../getCrypto'
import {type PrivateKeyHolder} from '../KeyHolder/brands'
import {type KeyPairV2} from '../KeyHolder/brandsV2'
import {curves} from '../KeyHolder/Curve.brand'
import {privateKeyHolderFromRaw} from '../KeyHolder/index'
import {generateKeyPairFromSeed} from './cryptobox'

export const MASTER_SEED_LENGTH = 32

const SECP256K1_ORDER = BigInt(
  '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141'
)

export function generateMasterSeed(): Uint8Array {
  return new Uint8Array(getCrypto().randomBytes(MASTER_SEED_LENGTH))
}

export function deriveBytes(
  masterSeed: Uint8Array,
  path: string,
  length: number
): Uint8Array {
  return hkdf(sha256, masterSeed, undefined, `vexl/${path}`, length)
}

function isValidSecp256k1Scalar(bytes: Uint8Array): boolean {
  const scalar = BigInt(`0x${Buffer.from(bytes).toString('hex')}`)
  return scalar > BigInt(0) && scalar < SECP256K1_ORDER
}

function deriveSecp256k1Scalar(
  masterSeed: Uint8Array,
  path: string,
  attempt = 0
): Uint8Array {
  const bytes = deriveBytes(
    masterSeed,
    attempt === 0 ? path : `${path}#${attempt}`,
    32
  )
  return isValidSecp256k1Scalar(bytes)
    ? bytes
    : deriveSecp256k1Scalar(masterSeed, path, attempt + 1)
}

// The key type is part of the HKDF info so V1 and V2 keys derived from the same path never share bytes.
export function derivePrivateKeyHolder(
  masterSeed: Uint8Array,
  path: string
): PrivateKeyHolder {
  return privateKeyHolderFromRaw(
    Buffer.from(deriveSecp256k1Scalar(masterSeed, `${path}/secp256k1`)),
    curves.secp256k1
  )
}

export async function deriveKeyPairV2(
  masterSeed: Uint8Array,
  path: string
): Promise<KeyPairV2> {
  return await generateKeyPairFromSeed(
    deriveBytes(masterSeed, `${path}/ed25519`, 32)
  )
}
