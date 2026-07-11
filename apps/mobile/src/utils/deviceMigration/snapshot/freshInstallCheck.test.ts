import AsyncStorage from '@react-native-async-storage/async-storage'
import {Effect, Either} from 'effect'
import * as SecretStore from 'expo-secure-store'
import {storage} from '../../mmkv/effectMmkv'
import {readMigrationControlRecord} from '../controlStore'
import {verifyFreshInstallForMigration} from './freshInstallCheck'

jest.mock('expo-file-system', () =>
  jest.requireActual('./inMemoryExpoFileSystem').createInMemoryExpoFileSystem()
)

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn()},
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}))

jest.mock('../controlStore', () => ({
  readMigrationControlRecord: jest.fn(),
}))

interface FakeFileSystem {
  readonly __reset: () => void
  readonly __writeFile: (uri: string, bytes: Uint8Array) => void
}

const fileSystem = jest.requireMock<FakeFileSystem>('expo-file-system')

async function resultCode(): Promise<string | undefined> {
  const result = await Effect.runPromise(
    verifyFreshInstallForMigration().pipe(Effect.either)
  )
  return Either.isLeft(result) ? result.left.code : undefined
}

describe('fresh destination precondition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storage._storage.clearAll()
    fileSystem.__reset()
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null)
    jest.mocked(SecretStore.getItemAsync).mockResolvedValue(null)
    jest.mocked(readMigrationControlRecord).mockReturnValue({mode: 'normal'})
  })

  it('accepts an empty installation', async () => {
    await expect(resultCode()).resolves.toBeUndefined()
  })

  it('rejects an AsyncStorage session', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('session')
    await expect(resultCode()).resolves.toBe('freshInstallRequired')
  })

  it('rejects either SecureStore session slot', async () => {
    jest.mocked(SecretStore.getItemAsync).mockResolvedValueOnce('secret')
    await expect(resultCode()).resolves.toBe('freshInstallRequired')
    jest.mocked(SecretStore.getItemAsync).mockResolvedValueOnce(null)
    jest.mocked(SecretStore.getItemAsync).mockResolvedValueOnce('legacy')
    await expect(resultCode()).resolves.toBe('freshInstallRequired')
  })

  it('allows MMKV state when no session exists', async () => {
    storage._storage.set('preferences', '{}')
    await expect(resultCode()).resolves.toBeUndefined()
  })

  it('rejects approved and legacy account files', async () => {
    fileSystem.__writeFile(
      'file:///documents/chat-images/chat/image.jpg',
      Uint8Array.of(1)
    )
    await expect(resultCode()).resolves.toBe('freshInstallRequired')
    fileSystem.__reset()
    fileSystem.__writeFile(
      'file:///documents/profilePicturelegacy.jpg',
      Uint8Array.of(1)
    )
    await expect(resultCode()).resolves.toBe('freshInstallRequired')
  })

  it('rejects unresolved migration control state', async () => {
    jest.mocked(readMigrationControlRecord).mockReturnValue({
      mode: 'recoveryRequired',
    })
    await expect(resultCode()).resolves.toBe('freshInstallRequired')
  })
})
