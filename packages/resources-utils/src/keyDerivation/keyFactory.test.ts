import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  seal,
  sign,
  unseal,
  verifySignature,
} from '@vexl-next/cryptography/src/operations/cryptobox'
import {
  ecdsaSign,
  ecdsaVerify,
} from '@vexl-next/cryptography/src/operations/ecdsa'
import {
  eciesGTMDecrypt,
  eciesGTMEncrypt,
} from '@vexl-next/cryptography/src/operations/ecies'
import {type ClubKeys} from '@vexl-next/domain/src/general/clubs'
import {
  generateMasterSeed,
  KeyDerivationIndex,
  MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {NoteId, NoteRepostId} from '@vexl-next/domain/src/general/notes'
import {Effect, Schema} from 'effect'
import {
  deriveClubKeys,
  deriveIdentityKeyPairV2,
  deriveIdentityPrivateKey,
  deriveInboxPrivateKey,
  deriveNoteRepostId,
} from './keyFactory'

const index = Schema.decodeSync(KeyDerivationIndex)
const noteId = Schema.decodeSync(NoteId)('7c9e6679-7425-40de-944b-e07fc1f90ae7')
const fixedSeed = Schema.decodeSync(MasterSeed)(
  '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
)

interface DerivedKeys {
  identityV1: PrivateKeyHolder
  identityV2: KeyPairV2
  inbox0: PrivateKeyHolder
  inbox1: PrivateKeyHolder
  club0: ClubKeys
  club1: ClubKeys
}

const deriveAll = async (masterSeed: MasterSeed): Promise<DerivedKeys> =>
  await Effect.runPromise(
    Effect.all({
      identityV1: deriveIdentityPrivateKey(masterSeed),
      identityV2: deriveIdentityKeyPairV2(masterSeed),
      inbox0: deriveInboxPrivateKey(masterSeed, index(0)),
      inbox1: deriveInboxPrivateKey(masterSeed, index(1)),
      club0: deriveClubKeys(masterSeed, index(0)),
      club1: deriveClubKeys(masterSeed, index(1)),
    })
  )

describe('key factory', () => {
  it('is deterministic for the same seed', async () => {
    const masterSeed = generateMasterSeed()
    expect(await deriveAll(masterSeed)).toEqual(await deriveAll(masterSeed))
    expect(deriveNoteRepostId(masterSeed, noteId)).toBe(
      deriveNoteRepostId(masterSeed, noteId)
    )
  })

  it('derives distinct keys for every path and seed', async () => {
    const keys = await deriveAll(generateMasterSeed())
    const otherSeedKeys = await deriveAll(generateMasterSeed())

    const publicKeys = [
      keys.identityV1.publicKeyPemBase64,
      keys.identityV2.publicKey,
      keys.inbox0.publicKeyPemBase64,
      keys.inbox1.publicKeyPemBase64,
      keys.club0.oldKeyPair.publicKeyPemBase64,
      keys.club0.keyPair.publicKey,
      keys.club1.oldKeyPair.publicKeyPemBase64,
      keys.club1.keyPair.publicKey,
      otherSeedKeys.identityV1.publicKeyPemBase64,
      otherSeedKeys.identityV2.publicKey,
      otherSeedKeys.inbox0.publicKeyPemBase64,
      otherSeedKeys.club0.keyPair.publicKey,
    ]
    expect(new Set(publicKeys).size).toBe(publicKeys.length)
  })

  it('pins the derived repost id', () => {
    const repostId = deriveNoteRepostId(fixedSeed, noteId)
    expect(repostId).toBe('f1197f55-b24a-4180-a9c4-99eb5a3bddca')
    expect(Schema.is(NoteRepostId)(repostId)).toBe(true)
    expect(repostId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('derives repost ids distinct per note', () => {
    const otherNoteId = Schema.decodeSync(NoteId)(
      '1b4e28ba-2fa1-41d2-883f-0016d3cca427'
    )
    expect(deriveNoteRepostId(fixedSeed, noteId)).not.toBe(
      deriveNoteRepostId(fixedSeed, otherNoteId)
    )
  })

  it('derives V1 keys that work with ecies and ecdsa', async () => {
    const {inbox0, club0} = await deriveAll(generateMasterSeed())

    for (const keyHolder of [inbox0, club0.oldKeyPair]) {
      const cipher = await eciesGTMEncrypt({
        publicKey: keyHolder.publicKeyPemBase64,
        data: 'hello',
      })
      expect(
        await eciesGTMDecrypt({
          privateKey: keyHolder.privateKeyPemBase64,
          data: cipher,
        })
      ).toBe('hello')

      const signature = ecdsaSign({
        privateKey: keyHolder.privateKeyPemBase64,
        challenge: 'challenge',
      })
      expect(
        ecdsaVerify({
          pubKey: keyHolder.publicKeyPemBase64,
          challenge: 'challenge',
          signature,
        })
      ).toBe(true)
    }
  })

  it('derives V2 keypairs that work with cryptobox seal and sign', async () => {
    const {identityV2, club0} = await deriveAll(generateMasterSeed())

    for (const keyPair of [identityV2, club0.keyPair]) {
      expect(
        await unseal(await seal('hello', keyPair.publicKey), keyPair)
      ).toBe('hello')
      expect(
        await verifySignature(
          'challenge',
          await sign('challenge', keyPair.privateKey),
          keyPair.publicKey
        )
      ).toBe(true)
    }
  })
})
