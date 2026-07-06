/**
 * Pins the checked-in NSE test vectors
 * (test-vectors/nse-test-vectors.json) to the reference TypeScript
 * implementation. If this test fails after regenerating the vectors the
 * reference implementation changed and the Swift NSE implementation must be
 * re-validated.
 */
import {Schema} from 'effect/index'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {importKeyPair} from '../KeyHolder'
import {privatePemToRaw} from '../KeyHolder/keyUtils'
import {ecdsaVerify} from '../operations/ecdsa'
import {eciesGTMDecrypt} from '../operations/ecies'
import {eciesLegacyDecrypt} from '../operations/eciesLegacy'
import {
  NSE_TEST_VECTORS_RELATIVE_PATH,
  NseTestVectorsFile,
  type EciesDecryptVector,
} from './nseTestVectorsFile'

const vectorsFile = Schema.decodeUnknownSync(NseTestVectorsFile)(
  JSON.parse(
    readFileSync(
      join(__dirname, '../..', NSE_TEST_VECTORS_RELATIVE_PATH),
      'utf8'
    )
  )
)

describe('NSE test vectors', () => {
  describe('keys', () => {
    it.each(vectorsFile.keys)(
      'key $id is consistent across all its encodings',
      (key) => {
        const holder = importKeyPair(key.privateKeyPemBase64)
        expect(holder.publicKeyPemBase64).toEqual(key.publicKeyPemBase64)

        const raw = privatePemToRaw(key.privateKeyPemBase64)
        expect(raw.curve).toEqual(key.curve)
        expect(raw.privateKey.toString('hex')).toEqual(key.privateKeyRawHex)
        expect(raw.publicKey.toString('hex')).toEqual(
          key.publicKeyRawUncompressedHex
        )
      }
    )

    it('every vector references a key from the keys block', () => {
      const keyIds = new Set(vectorsFile.keys.map((key) => key.id))
      const allVectors = [
        ...vectorsFile.eciesGTMDecrypt,
        ...vectorsFile.eciesLegacyDecrypt,
        ...vectorsFile.ecdsaVerify,
      ]
      for (const vector of allVectors) {
        expect(keyIds).toContain(vector.keyId)
      }
    })
  })

  const eciesSuites = [
    {
      name: 'eciesGTMDecrypt',
      vectors: vectorsFile.eciesGTMDecrypt,
      decrypt: eciesGTMDecrypt,
    },
    {
      name: 'eciesLegacyDecrypt',
      vectors: vectorsFile.eciesLegacyDecrypt,
      decrypt: eciesLegacyDecrypt,
    },
  ]

  for (const {name, vectors, decrypt} of eciesSuites) {
    describe(name, () => {
      const runDecrypt = async (vector: EciesDecryptVector): Promise<string> =>
        await decrypt({
          privateKey: vector.recipientPrivateKey,
          data: vector.ciphertext,
        })

      it.each(vectors.filter((vector) => vector.valid))(
        'vector $id decrypts to the expected plaintext',
        async (vector) => {
          expect(await runDecrypt(vector)).toEqual(vector.expectedPlaintext)
        }
      )

      it.each(vectors.filter((vector) => !vector.valid))(
        'vector $id fails to decrypt',
        async (vector) => {
          await expect(runDecrypt(vector)).rejects.toThrow()
        }
      )
    })
  }

  describe('ecdsaVerify', () => {
    it.each(vectorsFile.ecdsaVerify)(
      'vector $id verifies as valid=$valid',
      (vector) => {
        expect(
          ecdsaVerify({
            challenge: vector.message,
            signature: vector.signature,
            pubKey: vector.publicKey,
          })
        ).toEqual(vector.valid)
      }
    )
  })
})
