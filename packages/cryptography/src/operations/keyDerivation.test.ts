import {Schema} from 'effect/index'
import {
  createPrivateKey,
  createPublicKey,
  hkdfSync,
  randomBytes,
} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {PrivateKeyHolder} from '../KeyHolder/brands'
import {
  KeyPairV2,
  PRIVATE_KEY_V2_PREFIX,
  PUBLIC_KEY_V2_PREFIX,
} from '../KeyHolder/brandsV2'
import {privatePemToRaw} from '../KeyHolder/keyUtils'
import {
  deriveBytes,
  deriveKeyPairV2,
  derivePrivateKeyHolder,
  generateMasterSeed,
  MASTER_SEED_LENGTH,
} from './keyDerivation'

const KeyDerivationTestVectors = Schema.Struct({
  vectors: Schema.Array(
    Schema.Struct({
      masterSeedHex: Schema.String,
      path: Schema.String,
      bytes16Hex: Schema.String,
      privateKeyHolder: PrivateKeyHolder,
      keyPairV2: KeyPairV2,
    })
  ),
})

const {vectors} = Schema.decodeUnknownSync(KeyDerivationTestVectors)(
  JSON.parse(
    readFileSync(
      join(__dirname, '../../test-vectors/key-derivation-test-vectors.json'),
      'utf8'
    )
  )
)

const ED25519_PKCS8_SEED_PREFIX = Buffer.from(
  '302e020100300506032b657004220420',
  'hex'
)

const nodeEd25519PublicKeyFromSeed = (seed: Uint8Array): string => {
  const privateKey = createPrivateKey({
    key: Buffer.concat([ED25519_PKCS8_SEED_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8',
  })
  const {x} = createPublicKey(privateKey).export({format: 'jwk'})
  return `${PUBLIC_KEY_V2_PREFIX}${x}`
}

describe('key derivation test vectors', () => {
  it.each(vectors)('$path from seed $masterSeedHex', async (vector) => {
    const seed = Buffer.from(vector.masterSeedHex, 'hex')

    expect(
      Buffer.from(deriveBytes(seed, vector.path, 16)).toString('hex')
    ).toBe(vector.bytes16Hex)
    expect(derivePrivateKeyHolder(seed, vector.path)).toEqual(
      vector.privateKeyHolder
    )
    expect(await deriveKeyPairV2(seed, vector.path)).toEqual(vector.keyPairV2)
  })
})

describe('key derivation cross-checked against node crypto', () => {
  const seed = generateMasterSeed()
  const path = 'inbox/42'

  it('HKDF matches node hkdfSync', () => {
    const expected = Buffer.from(
      hkdfSync('sha256', seed, Buffer.alloc(0), `vexl/${path}`, 32)
    )
    expect(Buffer.from(deriveBytes(seed, path, 32))).toEqual(expected)
  })

  it('V1 private scalar is the HKDF output', () => {
    const {privateKey} = privatePemToRaw(
      derivePrivateKeyHolder(seed, path).privateKeyPemBase64
    )
    expect(privateKey).toEqual(
      Buffer.from(deriveBytes(seed, `${path}/secp256k1`, 32))
    )
  })

  it('V2 keypair matches node Ed25519 keypair from the same seed', async () => {
    const ed25519Seed = deriveBytes(seed, `${path}/ed25519`, 32)
    const keyPair = await deriveKeyPairV2(seed, path)

    expect(keyPair.publicKey).toBe(nodeEd25519PublicKeyFromSeed(ed25519Seed))
    expect(
      Buffer.from(
        keyPair.privateKey.slice(PRIVATE_KEY_V2_PREFIX.length),
        'base64url'
      )
    ).toEqual(
      Buffer.concat([
        ed25519Seed,
        Buffer.from(
          keyPair.publicKey.slice(PUBLIC_KEY_V2_PREFIX.length),
          'base64url'
        ),
      ])
    )
  })
})

describe('derived keys', () => {
  it('generates random master seeds of the right length', () => {
    const seed = generateMasterSeed()
    expect(seed).toHaveLength(MASTER_SEED_LENGTH)
    expect(seed).not.toEqual(generateMasterSeed())
  })

  it('differ per seed and per path, and V1/V2 never share bytes', () => {
    const seed = randomBytes(MASTER_SEED_LENGTH)
    const otherSeed = randomBytes(MASTER_SEED_LENGTH)

    expect(derivePrivateKeyHolder(seed, 'inbox/0')).not.toEqual(
      derivePrivateKeyHolder(seed, 'inbox/1')
    )
    expect(derivePrivateKeyHolder(seed, 'inbox/0')).not.toEqual(
      derivePrivateKeyHolder(otherSeed, 'inbox/0')
    )
    expect(deriveBytes(seed, 'club/0/secp256k1', 32)).not.toEqual(
      deriveBytes(seed, 'club/0/ed25519', 32)
    )
  })
})
