import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {MasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  BackupPin,
  encryptBackupFile,
  type BackupFile,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Either, Option, Schema} from 'effect'
import {createStore} from 'jotai'
import {dummySession} from '../session/dummySesssion'
import {
  backupFileToRestoreAtom,
  backupKeyPairAtom,
  decryptBackupToRestoreActionAtom,
  isBackupForKeyPair,
} from './backupToRestore'

jest.mock('react-native-mmkv')

const backup: BackupFile = {
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
const pin = Schema.decodeSync(BackupPin)('1234')

describe('decryptBackupToRestoreActionAtom', () => {
  const setUp = async (): Promise<ReturnType<typeof createStore>> => {
    const keyPair = await generateKeyPair()
    const file = await Effect.runPromise(
      encryptBackupFile({backup, pin, publicKey: keyPair.publicKey})
    )
    const store = createStore()
    store.set(backupFileToRestoreAtom, Option.some(file))
    store.set(backupKeyPairAtom, Option.some(keyPair))
    expect(isBackupForKeyPair(file, keyPair)).toBe(true)
    return store
  }

  const decrypt = async (
    store: ReturnType<typeof createStore>,
    withPin: BackupPin
  ): Promise<Either.Either<BackupFile, {_tag: string}>> =>
    await Effect.runPromise(
      Effect.either(store.set(decryptBackupToRestoreActionAtom, withPin))
    )

  it('opens the picked backup with the PIN', async () => {
    const store = await setUp()
    expect(await decrypt(store, pin)).toEqual(Either.right(backup))
  })

  it('tells a wrong PIN apart', async () => {
    const store = await setUp()
    expect(await decrypt(store, Schema.decodeSync(BackupPin)('4321'))).toEqual(
      Either.left(expect.objectContaining({_tag: 'BackupFileWrongPinError'}))
    )
  })

  it('refuses a key pair of another phone number', async () => {
    const store = await setUp()
    const otherKeyPair = await generateKeyPair()
    store.set(backupKeyPairAtom, Option.some(otherKeyPair))

    const file = store.get(backupFileToRestoreAtom)
    expect(
      Option.exists(file, (one) => isBackupForKeyPair(one, otherKeyPair))
    ).toBe(false)
    expect(await decrypt(store, pin)).toEqual(
      Either.left(
        expect.objectContaining({_tag: 'BackupFileWrongPhoneNumberError'})
      )
    )
  })
})
