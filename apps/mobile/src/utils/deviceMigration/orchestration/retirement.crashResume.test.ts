import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  testCommandNonce,
  testEraseCommandDigest,
  testManifestDigest,
  testSha256,
  testSnapshotContentDigest,
  testStagingReceiptDigest,
  testTransferId,
} from '@vexl-next/domain/src/general/deviceMigration/testFixtures'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Either, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import * as SecretStore from 'expo-secure-store'
import {Base64} from 'js-base64'
import {storage} from '../../mmkv/effectMmkv'
import {
  MIGRATION_CONTROL_RECORD_KEY,
  migrationControlStorage,
  readMigrationControlRecord,
  writeMigrationControlRecord,
} from '../controlStore'
import {isSourceCleanupComplete} from '../controlStore/domain'
import {runSourceRetirement} from './retirement'

jest.mock('expo-file-system', () =>
  jest
    .requireActual('../snapshot/inMemoryExpoFileSystem')
    .createInMemoryExpoFileSystem()
)

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 2,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('expo-notifications', () => ({
  __esModule: true,
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  setBadgeCountAsync: jest.fn(async () => true),
  dismissAllNotificationsAsync: jest.fn(async () => undefined),
}))

jest.mock('../../../api/vexlHttpClientLayer', () => ({
  getActiveVexlRequestCount: jest.fn(() => 0),
}))

jest.mock('../../inAppLoadingTasks/managedTaskFibers', () => ({
  getManagedTaskFiberCount: jest.fn(() => 0),
}))

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

interface FakeDirectoryConstructor {
  readonly prototype: {delete: () => void}
}

interface FakeFileSystem {
  readonly Directory: FakeDirectoryConstructor
  readonly __fsState: {
    readonly files: Map<string, Uint8Array>
    readonly directories: Set<string>
  }
  readonly __reset: () => void
  readonly __writeFile: (uri: string, bytes: Uint8Array) => void
}

const fileSystem = jest.requireMock<FakeFileSystem>('expo-file-system')
const asyncStorageValues = new Map<string, string>()
const secureStoreValues = new Map<string, string>()

async function retirementErrorCode(): Promise<string | undefined> {
  const result = await Effect.runPromise(
    runSourceRetirement().pipe(Effect.either)
  )
  return Either.isLeft(result) ? result.left.code : undefined
}

function seedCommittedRetirement(): void {
  writeMigrationControlRecord({
    mode: 'sourceRetirementCommitted',
    enteredAt: Schema.decodeSync(UnixMilliseconds)(1751000000000),
    transferId: testTransferId,
    pairingTranscriptDigest: testSha256,
    manifestDigest: testManifestDigest,
    snapshotContentDigest: testSnapshotContentDigest,
    stagingReceiptDigest: testStagingReceiptDigest,
    acceptedEraseCommandDigest: testEraseCommandDigest,
    acceptedEraseCommandNonce: testCommandNonce,
  })
}

describe('source retirement crash recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storage._storage.clearAll()
    migrationControlStorage.clearAll()
    fileSystem.__reset()
    asyncStorageValues.clear()
    secureStoreValues.clear()

    jest
      .mocked(AsyncStorage.getItem)
      .mockImplementation(async (key) => asyncStorageValues.get(key) ?? null)
    jest.mocked(AsyncStorage.removeItem).mockImplementation(async (key) => {
      asyncStorageValues.delete(key)
    })
    jest
      .mocked(SecretStore.getItemAsync)
      .mockImplementation(async (key) => secureStoreValues.get(key) ?? null)
    jest.mocked(SecretStore.deleteItemAsync).mockImplementation(async (key) => {
      secureStoreValues.delete(key)
    })

    asyncStorageValues.set('session', 'encrypted-source-session')
    secureStoreValues.set('secretToken', 'legacy-source-secret')
    secureStoreValues.set('secretToken_V2', 'source-secret')
    secureStoreValues.set(
      'deviceMigration.qrAuthTxKey',
      Base64.fromUint8Array(new Uint8Array(32).fill(7))
    )
    storage._storage.set('account-data', JSON.stringify({private: true}))
    storage._storage.set('session:v2SecretWasWritten', true)
    fileSystem.__writeFile(
      'file:///documents/chat-images/chat/image.jpg',
      Uint8Array.of(1, 2, 3)
    )
    fileSystem.__writeFile(
      'file:///documents/profilePicture/avatar.jpg',
      Uint8Array.of(4, 5)
    )
    seedCommittedRetirement()
  })

  it('resumes the remaining checklist and reuses the persisted receipt', async () => {
    const deleteDirectory = jest
      .spyOn(fileSystem.Directory.prototype, 'delete')
      .mockImplementationOnce(() => {
        throw new Error('simulated process death during file cleanup')
      })

    await expect(retirementErrorCode()).resolves.toBe('cleanupIncomplete')

    const interrupted = readMigrationControlRecord()
    expect(interrupted.mode).toBe('sourceErasing')
    if (interrupted.mode !== 'sourceErasing')
      throw new Error('retirement was not journaled')
    expect(interrupted.cleanupProgress).toEqual({
      asyncStorageSessionDeleted: true,
      secureStoreSessionSecretsDeleted: true,
      pendingMmkvWritesInvalidated: true,
      mmkvAccountStateCleared: true,
      accountFileRootsDeleted: false,
      scheduledNotificationsCancelled: false,
      notificationStateCleared: false,
    })
    expect('sourceErasedReceipt' in interrupted).toBe(false)
    expect(storage._storage.getAllKeys()).toEqual([])
    expect(migrationControlStorage.contains(MIGRATION_CONTROL_RECORD_KEY)).toBe(
      true
    )
    expect(asyncStorageValues.has('session')).toBe(false)
    expect(secureStoreValues.has('secretToken')).toBe(false)
    expect(secureStoreValues.has('secretToken_V2')).toBe(false)

    const sessionRemoveCalls = jest.mocked(AsyncStorage.removeItem).mock.calls
      .length
    const secretDeleteCalls = jest.mocked(SecretStore.deleteItemAsync).mock
      .calls.length
    deleteDirectory.mockRestore()

    const completed = await Effect.runPromise(runSourceRetirement())
    expect(completed.mode).toBe('sourceErasedAwaitingDestinationAck')
    expect(isSourceCleanupComplete(completed.cleanupProgress)).toBe(true)
    expect(jest.mocked(AsyncStorage.removeItem)).toHaveBeenCalledTimes(
      sessionRemoveCalls
    )
    expect(jest.mocked(SecretStore.deleteItemAsync)).toHaveBeenCalledTimes(
      secretDeleteCalls
    )
    expect(
      jest.mocked(Notifications.cancelAllScheduledNotificationsAsync)
    ).toHaveBeenCalledTimes(1)
    expect(jest.mocked(Notifications.setBadgeCountAsync)).toHaveBeenCalledWith(
      0
    )
    expect(
      jest.mocked(Notifications.dismissAllNotificationsAsync)
    ).toHaveBeenCalledTimes(1)
    expect(storage._storage.getAllKeys()).toEqual([])
    expect(
      fileSystem.__fsState.files.has(
        'file:///documents/chat-images/chat/image.jpg'
      )
    ).toBe(false)
    expect(
      fileSystem.__fsState.files.has(
        'file:///documents/profilePicture/avatar.jpg'
      )
    ).toBe(false)
    expect(migrationControlStorage.contains(MIGRATION_CONTROL_RECORD_KEY)).toBe(
      true
    )

    const receiptNonce = completed.sourceErasedReceipt.receiptNonce
    const callsBeforeNoOp = {
      sessionRemove: jest.mocked(AsyncStorage.removeItem).mock.calls.length,
      secretDelete: jest.mocked(SecretStore.deleteItemAsync).mock.calls.length,
      cancelNotifications: jest.mocked(
        Notifications.cancelAllScheduledNotificationsAsync
      ).mock.calls.length,
    }
    const resumedAgain = await Effect.runPromise(runSourceRetirement())
    expect(resumedAgain.sourceErasedReceipt.receiptNonce).toBe(receiptNonce)
    expect(resumedAgain.sourceErasedReceipt.toData()).toEqual(
      completed.sourceErasedReceipt.toData()
    )
    expect(jest.mocked(AsyncStorage.removeItem)).toHaveBeenCalledTimes(
      callsBeforeNoOp.sessionRemove
    )
    expect(jest.mocked(SecretStore.deleteItemAsync)).toHaveBeenCalledTimes(
      callsBeforeNoOp.secretDelete
    )
    expect(
      jest.mocked(Notifications.cancelAllScheduledNotificationsAsync)
    ).toHaveBeenCalledTimes(callsBeforeNoOp.cancelNotifications)
    expect(storage._storage.getAllKeys()).toEqual([])
    expect(migrationControlStorage.contains(MIGRATION_CONTROL_RECORD_KEY)).toBe(
      true
    )
  })
})
