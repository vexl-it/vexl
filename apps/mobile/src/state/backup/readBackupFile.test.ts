import {MasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  BackupFileFromJson,
  type BackupFile,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Either, Schema} from 'effect'
import {dummySession} from '../session/dummySesssion'
import {decodeBackupFile} from './readBackupFile'

jest.mock('react-native-mmkv')

const backupFile: BackupFile = {
  version: 1,
  session: {
    phoneNumber: dummySession.phoneNumber,
    sessionCredentials: dummySession.sessionCredentials,
    privateKey: dummySession.privateKey,
    keyPairV2: dummySession.keyPairV2,
    isLiquidityProvider: false,
  },
  masterSeed: Schema.decodeSync(MasterSeed)('44'.repeat(32)),
  legacyInboxKeys: [],
  legacyClubKeys: {},
  legacyClubKeysWaitingForAdmission: [],
}
const backupJson = Schema.encodeSync(BackupFileFromJson)(backupFile)

const decode = async (
  content: string
): Promise<Either.Either<BackupFile, {_tag: string; reason: string}>> =>
  await Effect.runPromise(Effect.either(decodeBackupFile(content)))

describe('decodeBackupFile', () => {
  it('decodes a valid backup', async () => {
    expect(await decode(backupJson)).toEqual(Either.right(backupFile))
  })

  it.each([
    ['not json', 'definitely not json'],
    ['json without a version', JSON.stringify({hello: 'there'})],
    [
      'a v1 file missing the seed',
      JSON.stringify({...JSON.parse(backupJson), masterSeed: undefined}),
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
