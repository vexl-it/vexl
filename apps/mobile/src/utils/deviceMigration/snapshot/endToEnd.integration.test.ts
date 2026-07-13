import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  type ManifestDigest,
  type SnapshotContentDigest,
} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {SourceErasedReceiptQrCode} from '@vexl-next/domain/src/general/deviceMigration/qrCodes'
import {MmkvEntry} from '@vexl-next/domain/src/general/deviceMigration/snapshotEntries'
import {
  testCleanupResultDigest,
  testCommandNonce,
  testEraseCommandDigest,
  testQrAuthMac,
  testReceiptNonce,
  testSha256,
  testStagingReceiptDigest,
  testTransferId,
  testVersionTriple,
} from '@vexl-next/domain/src/general/deviceMigration/testFixtures'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Either, Option, Schema} from 'effect'
import * as SecretStore from 'expo-secure-store'
import {getDefaultStore} from 'jotai'
import {Base64} from 'js-base64'
import {VexlNotificationSecretState} from '../../../state/notifications/vexlNotificationTokenAtom'
import {sessionHolderAtom} from '../../../state/session'
import {dummySession} from '../../../state/session/dummySesssion'
import {TradeRemindersState} from '../../../state/tradeReminders/domain'
import {
  freezeMmkvPersistence,
  registerMmkvKey,
  unfreezeMmkvPersistence,
} from '../../atomUtils/mmkvMigrationRegistry'
import {storage} from '../../mmkv/effectMmkv'
import {Preferences} from '../../preferences/domain'
import {
  migrationControlStorage,
  readMigrationControlRecord,
  writeMigrationControlRecord,
} from '../controlStore'
import {createSnapshotExport, type SnapshotExportRecord} from './exporter'
import {installStagedSnapshot} from './installer'
import {
  initStaging,
  STAGING_DIRECTORY_NAME,
  verifyStagingComplete,
} from './stagingStore'

jest.mock('./ensurePersistenceModulesRegistered', () => ({}))

jest.mock('expo-file-system', () =>
  jest.requireActual('./inMemoryExpoFileSystem').createInMemoryExpoFileSystem()
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

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

interface FakeFileSystem {
  readonly __fsState: {
    readonly files: Map<string, Uint8Array>
    readonly directories: Set<string>
  }
  readonly __reset: () => void
  readonly __writeFile: (uri: string, bytes: Uint8Array) => void
  readonly __readFile: (uri: string) => Uint8Array | undefined
}

const fileSystem = jest.requireMock<FakeFileSystem>('expo-file-system')
const asyncStorageValues = new Map<string, string>()
const secureStoreValues = new Map<string, string>()
const sourceDocuments =
  'file:///var/mobile/Containers/Data/Application/SOURCE/Documents'
const destinationDocuments = 'file:///documents'

registerMmkvKey({
  key: 'messagingState',
  policy: 'account',
  nativeType: 'string',
})
registerMmkvKey({key: 'offers', policy: 'account', nativeType: 'string'})
registerMmkvKey({
  key: 'storedContacts',
  policy: 'account',
  nativeType: 'string',
})
registerMmkvKey({key: 'preferences', policy: 'account', nativeType: 'string'})
registerMmkvKey({
  key: 'createOfferSuggestionVisible',
  policy: 'preference',
  nativeType: 'string',
})
registerMmkvKey({
  key: 'tradeReminders',
  policy: 'rebuild',
  nativeType: 'string',
})
registerMmkvKey({
  key: 'vexlNotificationToken',
  policy: 'account',
  nativeType: 'string',
})
registerMmkvKey({
  key: 'accountNativeBoolean',
  policy: 'account',
  nativeType: 'boolean',
})
registerMmkvKey({
  key: 'logs_enabled',
  policy: 'deviceLocal',
  nativeType: 'boolean',
})
registerMmkvKey({
  key: 'numberOfLoginAttempts',
  policy: 'ephemeral',
  nativeType: 'string',
})

const encodeJson = <A, I>(
  schema: Schema.Schema<A, I, never>,
  value: A
): string => Schema.encodeSync(Schema.parseJson(schema))(value)

const preferences = Schema.decodeSync(Preferences)({
  notificationPreferences: {
    offer: true,
    chat: false,
    marketplace: true,
    newOfferInMarketplace: false,
    newPhoneContacts: true,
    inactivityWarnings: false,
    marketing: true,
  },
  allowSendingImages: true,
  isDeveloper: true,
  showTextDebugButton: true,
  enableNewOffersNotificationDevMode: true,
  runTasksInParallel: false,
  lastUsedOfferSpokenLanguages: [],
})

const tradeReminders = Schema.decodeSync(TradeRemindersState)({
  reminders: [
    {
      chatId: 'chat-1',
      notificationId: 'source-os-notification-id',
      scheduledFor: 100,
      meetingTime: 200,
    },
  ],
})

const notificationToken = Schema.decodeSync(VexlNotificationSecretState)({
  secret: null,
  systemVexlToken: null,
  marketingVexlToken: null,
  lastUpdatedMetadata: {
    version: Schema.decodeSync(VersionCode)(42),
    locale: 'en',
  },
})

function seedSourceAccount(): void {
  storage._storage.set(
    'messagingState',
    JSON.stringify({
      messagingState: [
        {
          imageUri: `${sourceDocuments}/chat-images/raw+base64=/nested/photo one.jpg`,
          profileUri: `${sourceDocuments}/profilePicture/alice avatar.jpg`,
        },
      ],
    })
  )
  storage._storage.set('offers', JSON.stringify([{id: 'offer-1'}]))
  storage._storage.set(
    'storedContacts',
    JSON.stringify({contacts: [{id: 'contact-1'}]})
  )
  storage._storage.set('preferences', encodeJson(Preferences, preferences))
  storage._storage.set('createOfferSuggestionVisible', JSON.stringify(false))
  storage._storage.set(
    'tradeReminders',
    encodeJson(TradeRemindersState, tradeReminders)
  )
  storage._storage.set(
    'vexlNotificationToken',
    encodeJson(VexlNotificationSecretState, notificationToken)
  )
  storage._storage.set('accountNativeBoolean', true)
  storage._storage.set('logs_enabled', true)
  storage._storage.set('numberOfLoginAttempts', JSON.stringify(7))

  fileSystem.__writeFile(
    'file:///documents/chat-images/raw+base64=/nested/photo one.jpg',
    Uint8Array.of(1, 2, 3)
  )
  fileSystem.__writeFile(
    'file:///documents/profilePicture/alice avatar.jpg',
    Uint8Array.of(4, 5)
  )
  fileSystem.__writeFile(
    'file:///documents/profilePicturelegacy-user.jpg',
    Uint8Array.of(6, 7, 8)
  )
  getDefaultStore().set(sessionHolderAtom, {
    state: 'loggedIn',
    session: {
      ...dummySession,
      sessionCredentials: {
        ...dummySession.sessionCredentials,
        hash: dummySession.sessionCredentials.vexlAuthHeader.data.hash,
      },
    },
  })
}

function concatChunks(chunks: readonly Uint8Array[]): Uint8Array {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const result = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function entryFromRecord(
  start: Extract<SnapshotExportRecord, {kind: 'mmkvEntryStart'}>,
  chunks: readonly Uint8Array[]
): typeof MmkvEntry.Type {
  const bytes = concatChunks(chunks)
  if (start.nativeType === 'string')
    return Schema.decodeSync(MmkvEntry)({
      type: 'string',
      key: start.key,
      value: Buffer.from(bytes).toString('utf8'),
    })
  if (start.nativeType === 'boolean')
    return Schema.decodeSync(MmkvEntry)({
      type: 'boolean',
      key: start.key,
      value: bytes[0] === 1,
    })
  if (start.nativeType === 'number')
    return Schema.decodeSync(MmkvEntry)({
      type: 'number',
      key: start.key,
      value: new DataView(bytes.buffer, bytes.byteOffset, 8).getFloat64(
        0,
        false
      ),
    })
  return Schema.decodeSync(MmkvEntry)({
    type: 'buffer',
    key: start.key,
    value: Base64.fromUint8Array(bytes),
    byteLength: bytes.length,
  })
}

async function streamExportIntoStaging(): Promise<{
  readonly snapshotContentDigest: SnapshotContentDigest
  readonly manifestDigest: ManifestDigest
}> {
  const snapshot = await Effect.runPromise(createSnapshotExport())
  const staging = await Effect.runPromise(initStaging())
  await Effect.runPromise(staging.stageManifest(snapshot.manifest))

  let activeEntry:
    | Extract<SnapshotExportRecord, {kind: 'mmkvEntryStart'}>
    | undefined
  let activeFile: Extract<SnapshotExportRecord, {kind: 'fileStart'}> | undefined
  let sessionActive = false
  let chunks: Uint8Array[] = []

  for (;;) {
    const next = await Effect.runPromise(snapshot.nextRecord())
    if (Option.isNone(next)) break
    const record = next.value
    if (record.kind === 'mmkvEntryStart') {
      activeEntry = record
      chunks = []
    } else if (record.kind === 'sessionStart') {
      sessionActive = true
      chunks = []
    } else if (record.kind === 'fileStart') {
      activeFile = record
    } else if (record.kind === 'dataChunk') {
      if (activeFile !== undefined) {
        await Effect.runPromise(
          staging.appendFileChunk(activeFile.path, record.bytes)
        )
      } else chunks.push(record.bytes)
    } else if (record.kind === 'mmkvEntryEnd') {
      if (activeEntry === undefined) throw new Error('missing entry start')
      await Effect.runPromise(
        staging.stageMmkvEntry(entryFromRecord(activeEntry, chunks))
      )
      activeEntry = undefined
      chunks = []
    } else if (record.kind === 'sessionEnd') {
      if (!sessionActive) throw new Error('missing session start')
      await Effect.runPromise(
        staging.stageSessionJson(Buffer.from(concatChunks(chunks)).toString())
      )
      sessionActive = false
      chunks = []
    } else if (record.kind === 'fileEnd') {
      await Effect.runPromise(staging.finalizeFile(record.path))
      activeFile = undefined
    } else if (record.kind === 'snapshotEnd') {
      expect(record.snapshotContentDigest).toBe(
        snapshot.manifest.snapshotContentDigest
      )
    }
  }

  return {
    snapshotContentDigest: snapshot.manifest.snapshotContentDigest,
    manifestDigest: snapshot.manifest.manifestDigest,
  }
}

function makeDestinationInstallable(
  snapshotContentDigest: SnapshotContentDigest,
  manifestDigest: ManifestDigest
): void {
  const enteredAt = Schema.decodeSync(UnixMilliseconds)(1751000000000)
  const receipt = new SourceErasedReceiptQrCode({
    qrSchemaVersion: 1,
    version: testVersionTriple,
    transferId: testTransferId,
    manifestDigest,
    snapshotContentDigest,
    acceptedEraseCommandDigest: testEraseCommandDigest,
    acceptedEraseCommandNonce: testCommandNonce,
    receiptNonce: testReceiptNonce,
    cleanupResultDigest: testCleanupResultDigest,
    issuedAt: enteredAt,
    mac: testQrAuthMac,
  })
  writeMigrationControlRecord({
    mode: 'destinationSourceEraseConfirmed',
    enteredAt,
    transferId: testTransferId,
    pairingTranscriptDigest: testSha256,
    manifestDigest,
    snapshotContentDigest,
    stagingReceiptDigest: testStagingReceiptDigest,
    issuedEraseCommands: [
      {
        eraseCommandDigest: testEraseCommandDigest,
        commandNonce: testCommandNonce,
        issuedAt: enteredAt,
        expiresAt: Schema.decodeSync(UnixMilliseconds)(1751000300000),
      },
    ],
    sourceErasedReceipt: receipt,
  })
}

function clearLiveDestinationState(): void {
  storage._storage.clearAll()
  const stagingPrefix = `${destinationDocuments}/${STAGING_DIRECTORY_NAME}`
  for (const path of fileSystem.__fsState.files.keys()) {
    if (!path.startsWith(stagingPrefix)) fileSystem.__fsState.files.delete(path)
  }
  for (const path of fileSystem.__fsState.directories) {
    if (
      path !== destinationDocuments &&
      !path.startsWith(stagingPrefix) &&
      path !== 'file:///caches'
    )
      fileSystem.__fsState.directories.delete(path)
  }
  asyncStorageValues.clear()
  secureStoreValues.delete('secretToken')
  secureStoreValues.delete('secretToken_V2')
}

async function effectErrorCode(
  effect: Effect.Effect<unknown, {readonly code: string}>
): Promise<string | undefined> {
  const result = await Effect.runPromise(effect.pipe(Effect.either))
  return Either.isLeft(result) ? result.left.code : undefined
}

describe('device migration snapshot end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storage._storage.clearAll()
    migrationControlStorage.clearAll()
    fileSystem.__reset()
    asyncStorageValues.clear()
    secureStoreValues.clear()
    unfreezeMmkvPersistence()

    jest
      .mocked(AsyncStorage.getItem)
      .mockImplementation(async (key) => asyncStorageValues.get(key) ?? null)
    jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
      asyncStorageValues.set(key, value)
    })
    jest.mocked(AsyncStorage.removeItem).mockImplementation(async (key) => {
      asyncStorageValues.delete(key)
    })
    jest
      .mocked(SecretStore.getItemAsync)
      .mockImplementation(async (key) => secureStoreValues.get(key) ?? null)
    jest
      .mocked(SecretStore.setItemAsync)
      .mockImplementation(async (key, value) => {
        secureStoreValues.set(key, value)
      })
    jest.mocked(SecretStore.deleteItemAsync).mockImplementation(async (key) => {
      secureStoreValues.delete(key)
    })

    writeMigrationControlRecord({
      mode: 'sourceServing',
      enteredAt: Schema.decodeSync(UnixMilliseconds)(1751000000000),
      transferId: testTransferId,
      pairingTranscriptDigest: testSha256,
    })
    seedSourceAccount()
    secureStoreValues.set('secretToken_V2', 'source-session-secret')
    freezeMmkvPersistence()
  })

  afterEach(() => {
    unfreezeMmkvPersistence()
    getDefaultStore().set(sessionHolderAtom, {state: 'loggedOut'})
  })

  it('round-trips representative account state through encrypted staging', async () => {
    const digests = await streamExportIntoStaging()
    const verified = await Effect.runPromise(verifyStagingComplete())
    expect(verified.manifest.snapshotContentDigest).toBe(
      digests.snapshotContentDigest
    )

    clearLiveDestinationState()
    makeDestinationInstallable(
      digests.snapshotContentDigest,
      digests.manifestDigest
    )
    await Effect.runPromise(installStagedSnapshot())

    const control = readMigrationControlRecord()
    expect(control.mode).toBe('destinationActivating')
    if (control.mode === 'destinationActivating')
      expect(control.snapshotContentDigest).toBe(digests.snapshotContentDigest)

    expect(
      JSON.parse(storage._storage.getString('messagingState') ?? '')
    ).toEqual({
      messagingState: [
        {
          imageUri:
            'file:///documents/chat-images/raw%2Bbase64%3D/nested/photo%20one.jpg',
          profileUri: 'file:///documents/profilePicture/alice%20avatar.jpg',
        },
      ],
    })
    expect(JSON.parse(storage._storage.getString('offers') ?? '')).toEqual([
      {id: 'offer-1'},
    ])
    expect(
      JSON.parse(storage._storage.getString('storedContacts') ?? '')
    ).toEqual({
      contacts: [{id: 'contact-1'}],
    })
    expect(storage._storage.getBoolean('accountNativeBoolean')).toBe(true)
    expect(storage._storage.getString('createOfferSuggestionVisible')).toBe(
      'false'
    )
    expect(storage._storage.contains('logs_enabled')).toBe(false)
    expect(storage._storage.contains('numberOfLoginAttempts')).toBe(false)

    const installedReminders = Schema.decodeSync(
      Schema.parseJson(TradeRemindersState)
    )(storage._storage.getString('tradeReminders') ?? '')
    expect(installedReminders.reminders[0]?.notificationId).toBe('')
    const installedToken = Schema.decodeSync(
      Schema.parseJson(VexlNotificationSecretState)
    )(storage._storage.getString('vexlNotificationToken') ?? '')
    expect(installedToken.lastUpdatedMetadata).toBeNull()

    expect(
      fileSystem.__readFile(
        'file:///documents/profilePicture/profilePicturelegacy-user.jpg'
      )
    ).toEqual(Uint8Array.of(6, 7, 8))
    const installedSecret = secureStoreValues.get('secretToken_V2')
    expect(installedSecret).toBeDefined()
    expect(installedSecret).not.toBe('source-session-secret')
    const secureOrder = jest
      .mocked(SecretStore.setItemAsync)
      .mock.invocationCallOrder.at(-1)
    const asyncOrder = jest
      .mocked(AsyncStorage.setItem)
      .mock.invocationCallOrder.at(-1)
    expect(secureOrder).toBeDefined()
    expect(asyncOrder).toBeDefined()
    if (secureOrder !== undefined && asyncOrder !== undefined)
      expect(secureOrder).toBeLessThan(asyncOrder)
  })

  it('rejects a one-byte staged-blob corruption before installation begins', async () => {
    const digests = await streamExportIntoStaging()
    const stagingPrefix = `${destinationDocuments}/${STAGING_DIRECTORY_NAME}/`
    const blobPath = [...fileSystem.__fsState.files.keys()].find(
      (path) => path.startsWith(stagingPrefix) && !path.endsWith('/index')
    )
    if (blobPath === undefined) throw new Error('missing staged blob')
    const blob = fileSystem.__readFile(blobPath)
    if (blob === undefined || blob.length === 0)
      throw new Error('empty staged blob')
    const corrupted = new Uint8Array(blob)
    const corruptedIndex = corrupted.length - 1
    corrupted[corruptedIndex] = (corrupted[corruptedIndex] ?? 0) ^ 1
    fileSystem.__writeFile(blobPath, corrupted)

    await expect(effectErrorCode(verifyStagingComplete())).resolves.toBe(
      'digestMismatch'
    )

    clearLiveDestinationState()
    storage._storage.set('installationMustNotProceed', JSON.stringify(true))
    makeDestinationInstallable(
      digests.snapshotContentDigest,
      digests.manifestDigest
    )
    await expect(effectErrorCode(installStagedSnapshot())).resolves.toBe(
      'digestMismatch'
    )
    expect(storage._storage.getBoolean('accountNativeBoolean')).toBeUndefined()
    expect(storage._storage.contains('installationMustNotProceed')).toBe(true)
    expect(readMigrationControlRecord().mode).toBe('destinationInstalling')
  })
})
