import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {Effect, Either, Schema} from 'effect'
import {
  BackupFile,
  BackupPin,
  decryptBackupFile,
  encryptBackupFile,
  EncryptedBackupFileFromJson,
} from './BackupFile'

const pin = Schema.decodeSync(BackupPin)('1234')

const makeBackup = async (): Promise<BackupFile> => {
  const privateKey = generatePrivateKey()
  const keyPairV2 = await generateKeyPair()
  return Schema.validateSync(BackupFile)({
    session: {
      phoneNumber: '+420733733733',
      sessionCredentials: {
        publicKey: privateKey.publicKeyPemBase64,
        hash: 'hash',
        signature: 'signature',
        vexlAuthHeader: {
          data: {hash: 'hash', pk: keyPairV2.publicKey},
          signature: 'CBSig-signature',
        },
      },
      privateKey,
      keyPairV2,
      isLiquidityProvider: false,
      realUserData: {
        userName: 'Satoshi',
        image: {
          base64: Buffer.alloc(3_000_000, 7).toString('base64'),
          extension: 'jpg',
        },
      },
    },
    masterSeed: '44'.repeat(32),
    legacyInboxKeys: [],
    legacyClubKeys: {},
    legacyClubKeysWaitingForAdmission: [],
  })
}

describe('backup file encryption', () => {
  it('round-trips through JSON', async () => {
    const backup = await makeBackup()
    const keyPair = await generateKeyPair()

    const json = await Effect.runPromise(
      encryptBackupFile({backup, pin, publicKey: keyPair.publicKey}).pipe(
        Effect.flatMap(Schema.encode(EncryptedBackupFileFromJson))
      )
    )
    expect(json).not.toContain(backup.masterSeed)

    const decrypted = await Effect.runPromise(
      Schema.decode(EncryptedBackupFileFromJson)(json).pipe(
        Effect.flatMap((file) => decryptBackupFile({file, pin, keyPair}))
      )
    )
    expect(decrypted).toEqual(backup)
  })

  it('fails with BackupFileWrongPinError for a wrong PIN', async () => {
    const keyPair = await generateKeyPair()
    const file = await Effect.runPromise(
      encryptBackupFile({
        backup: await makeBackup(),
        pin,
        publicKey: keyPair.publicKey,
      })
    )

    const result = await Effect.runPromise(
      Effect.either(
        decryptBackupFile({
          file,
          pin: Schema.decodeSync(BackupPin)('12345678'),
          keyPair,
        })
      )
    )
    expect(result).toEqual(
      Either.left(expect.objectContaining({_tag: 'BackupFileWrongPinError'}))
    )
  })

  it('fails with BackupFileWrongPhoneNumberError for another key pair', async () => {
    const file = await Effect.runPromise(
      encryptBackupFile({
        backup: await makeBackup(),
        pin,
        publicKey: (await generateKeyPair()).publicKey,
      })
    )

    const result = await Effect.runPromise(
      Effect.either(
        decryptBackupFile({file, pin, keyPair: await generateKeyPair()})
      )
    )
    expect(result).toEqual(
      Either.left(
        expect.objectContaining({_tag: 'BackupFileWrongPhoneNumberError'})
      )
    )
  })

  it('fails with BackupFileCorruptedError for a malformed ciphertext', async () => {
    const keyPair = await generateKeyPair()
    const result = await Effect.runPromise(
      Effect.either(
        decryptBackupFile({
          file: {version: 1, publicKey: keyPair.publicKey, ciphertext: 'abcd'},
          pin,
          keyPair,
        })
      )
    )
    expect(result).toEqual(
      Either.left(expect.objectContaining({_tag: 'BackupFileCorruptedError'}))
    )
  })

  it.each([
    ['not json', 'definitely not json'],
    ['a plaintext backup', JSON.stringify({version: 1, masterSeed: '44'})],
    [
      'an unknown version',
      JSON.stringify({version: 2, publicKey: 'V2_PUB_x', ciphertext: ''}),
    ],
  ])('rejects %s as an encrypted backup', (_, content) => {
    expect(
      Either.isLeft(Schema.decodeEither(EncryptedBackupFileFromJson)(content))
    ).toBe(true)
  })

  it.each(['123', '123456789', '12a4', ''])('rejects PIN %p', (value) => {
    expect(Schema.is(BackupPin)(value)).toBe(false)
  })
})
