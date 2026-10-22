import {
  EncryptedBackupFileFromJson,
  type EncryptedBackupFile,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Either, Schema} from 'effect'
import {dummySession} from '../session/dummySesssion'
import {decodeBackupFile} from './readBackupFile'

jest.mock('react-native-mmkv')

const backupFile: EncryptedBackupFile = {
  version: 1,
  publicKey: dummySession.keyPairV2.publicKey,
  ciphertext: 'ciphertext',
}
const backupJson = Schema.encodeSync(EncryptedBackupFileFromJson)(backupFile)

const decode = async (
  content: string
): Promise<
  Either.Either<EncryptedBackupFile, {_tag: string; reason: string}>
> => await Effect.runPromise(Effect.either(decodeBackupFile(content)))

describe('decodeBackupFile', () => {
  it('decodes a valid backup', async () => {
    expect(await decode(backupJson)).toEqual(Either.right(backupFile))
  })

  it.each([
    ['not json', 'definitely not json'],
    ['json without a version', JSON.stringify({hello: 'there'})],
    [
      'a v1 file missing the ciphertext',
      JSON.stringify({...JSON.parse(backupJson), ciphertext: undefined}),
    ],
    [
      'an unencrypted backup',
      JSON.stringify({version: 1, masterSeed: '44'.repeat(32)}),
    ],
  ])('rejects %s as not a backup', async (_, content) => {
    expect(await decode(content)).toEqual(
      Either.left(
        expect.objectContaining({
          _tag: 'InvalidBackupFileError',
          reason: 'notABackup',
        })
      )
    )
  })

  it('tells a backup from a newer app version apart', async () => {
    expect(
      await decode(JSON.stringify({...JSON.parse(backupJson), version: 2}))
    ).toEqual(
      Either.left(
        expect.objectContaining({
          _tag: 'InvalidBackupFileError',
          reason: 'unsupportedVersion',
        })
      )
    )
  })
})
