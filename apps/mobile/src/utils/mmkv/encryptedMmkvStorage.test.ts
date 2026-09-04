import * as SecureStore from 'expo-secure-store'
import {createMMKV, deleteMMKV, existsMMKV} from 'react-native-mmkv'
import {
  DEVICE_BOUND_SECURE_STORE_OPTIONS,
  MMKV_ENCRYPTION_KEY,
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
} from '../secureStoreKeys'
import {
  ENCRYPTED_MMKV_ID,
  LEGACY_PLAINTEXT_MMKV_ID,
  openEncryptedMmkvStorage,
} from './encryptedMmkvStorage'
import {InMemoryMmkvStore, type MmkvStore} from './inMemoryMmkvStore'

jest.mock('react-native-mmkv')
jest.mock('expo-secure-store')

const deletedFiles: string[] = []
jest.mock('expo-file-system', () => ({
  Paths: {document: '/mock/documents'},
  File: jest.fn().mockImplementation((_dir: string, path: string) => ({
    exists: true,
    delete: () => {
      deletedFiles.push(path)
    },
  })),
}))

// Typed access to the manual mocks' test-only helpers.
const mmkvMock = jest.requireMock<{
  resetMockMmkvFiles: () => void
  createMockMMKV: typeof createMMKV
}>('react-native-mmkv')
const secureStoreMock = jest.requireMock<{
  resetMockSecureStore: () => void
}>('expo-secure-store')

const secureStoreGetItem = jest.mocked(SecureStore.getItem)
const secureStoreSetItem = jest.mocked(SecureStore.setItem)

// The MMKV mock extends the placeholder class, so check the exact constructor.
function isPlaceholderStore(store: MmkvStore): boolean {
  return store.constructor === InMemoryMmkvStore
}

function storedEncryptionKey(): string | null {
  return SecureStore.getItem(MMKV_ENCRYPTION_KEY)
}

function seedLegacyPlaintextStore(): void {
  const legacy = createMMKV({id: LEGACY_PLAINTEXT_MMKV_ID})
  legacy.set('offers', JSON.stringify({offers: ['favourite-mark']}))
  legacy.set('chatTagsState', JSON.stringify({tags: ['secret tag']}))
  legacy.set('session:v2SecretWasWritten', true)
}

beforeEach(() => {
  mmkvMock.resetMockMmkvFiles()
  secureStoreMock.resetMockSecureStore()
  deletedFiles.length = 0
  jest.clearAllMocks()
})

describe('openEncryptedMmkvStorage', () => {
  it('generates a device-bound key on a fresh install and opens an encrypted store', () => {
    const opened = openEncryptedMmkvStorage()

    expect(opened.status).toEqual({
      _tag: 'ready',
      encryptionKeySource: 'generated',
      migratedPlaintextKeyCount: undefined,
    })
    expect(opened.store.isEncrypted).toBe(true)
    expect(existsMMKV(ENCRYPTED_MMKV_ID)).toBe(true)

    const key = storedEncryptionKey()
    expect(key).toHaveLength(32)
    expect(key).toMatch(/^[A-Za-z0-9+/]{32}$/)
    expect(secureStoreSetItem).toHaveBeenCalledWith(
      MMKV_ENCRYPTION_KEY,
      key,
      DEVICE_BOUND_SECURE_STORE_OPTIONS
    )
    expect(existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)).toBe(false)
  })

  it('stores the key before the encrypted store is created', () => {
    const order: string[] = []
    secureStoreSetItem.mockImplementationOnce(() => {
      order.push('key stored')
    })
    jest.mocked(createMMKV).mockImplementationOnce((configuration) => {
      order.push('store created')
      return jest
        .requireActual('../../../__mocks__/react-native-mmkv')
        .createMMKV(configuration)
    })

    openEncryptedMmkvStorage()

    expect(order).toEqual(['key stored', 'store created'])
  })

  it('reuses the stored key and keeps data across foreground and background launches', () => {
    const firstLaunch = openEncryptedMmkvStorage()
    firstLaunch.store.set('offers', '{"offers":[]}')
    const key = storedEncryptionKey()

    const backgroundLaunch = openEncryptedMmkvStorage()
    const foregroundLaunch = openEncryptedMmkvStorage()

    expect(backgroundLaunch.status).toEqual({
      _tag: 'ready',
      encryptionKeySource: 'existing',
      migratedPlaintextKeyCount: undefined,
    })
    expect(backgroundLaunch.store.getString('offers')).toBe('{"offers":[]}')
    expect(foregroundLaunch.store.getString('offers')).toBe('{"offers":[]}')
    expect(storedEncryptionKey()).toBe(key)
    expect(secureStoreSetItem).toHaveBeenCalledTimes(1)
  })

  it('does not expose data to a store opened with a different key', () => {
    const opened = openEncryptedMmkvStorage()
    opened.store.set('offers', '{"offers":["mine"]}')

    const otherAccountsStore = createMMKV({
      id: ENCRYPTED_MMKV_ID,
      encryptionKey: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
    })

    expect(otherAccountsStore.getString('offers')).toBeUndefined()
    expect(otherAccountsStore.getAllKeys()).toEqual([])
  })

  describe('migration from the plaintext store', () => {
    it('copies strings and booleans, then empties and unlinks the plaintext store', () => {
      seedLegacyPlaintextStore()

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({
        _tag: 'ready',
        encryptionKeySource: 'generated',
        migratedPlaintextKeyCount: 3,
      })
      expect(opened.store.isEncrypted).toBe(true)
      expect(opened.store.getString('offers')).toBe(
        JSON.stringify({offers: ['favourite-mark']})
      )
      expect(opened.store.getString('chatTagsState')).toBe(
        JSON.stringify({tags: ['secret tag']})
      )
      expect(opened.store.getBoolean('session:v2SecretWasWritten')).toBe(true)

      const legacy = createMMKV({id: LEGACY_PLAINTEXT_MMKV_ID})
      expect(legacy.getAllKeys()).toEqual([])
      expect(deletedFiles).toEqual([
        `mmkv/${LEGACY_PLAINTEXT_MMKV_ID}`,
        `mmkv/${LEGACY_PLAINTEXT_MMKV_ID}.crc`,
      ])
    })

    it('keeps the plaintext source intact and fails closed when the import throws', () => {
      seedLegacyPlaintextStore()
      const importError = new Error('disk full')
      jest.mocked(createMMKV).mockImplementationOnce((configuration) => {
        const encrypted = mmkvMock.createMockMMKV(configuration)
        jest.spyOn(encrypted, 'set').mockImplementationOnce(() => {
          throw importError
        })
        return encrypted
      })

      const interrupted = openEncryptedMmkvStorage()

      expect(interrupted.status).toEqual({
        _tag: 'unavailable',
        cause: importError,
      })
      expect(isPlaceholderStore(interrupted.store)).toBe(true)
      expect(createMMKV({id: LEGACY_PLAINTEXT_MMKV_ID}).getAllKeys()).toEqual([
        'offers',
        'chatTagsState',
        'session:v2SecretWasWritten',
      ])
      expect(deletedFiles).toEqual([])

      const retried = openEncryptedMmkvStorage()

      expect(retried.status).toMatchObject({
        _tag: 'ready',
        migratedPlaintextKeyCount: 3,
      })
      expect(retried.store.getString('offers')).toBe(
        JSON.stringify({offers: ['favourite-mark']})
      )
      expect(createMMKV({id: LEGACY_PLAINTEXT_MMKV_ID}).getAllKeys()).toEqual(
        []
      )
    })

    it('re-imports idempotently when the previous launch died before clearing the plaintext store', () => {
      seedLegacyPlaintextStore()
      const key = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      SecureStore.setItem(MMKV_ENCRYPTION_KEY, key)
      const partiallyMigrated = createMMKV({
        id: ENCRYPTED_MMKV_ID,
        encryptionKey: key,
      })
      partiallyMigrated.set(
        'offers',
        JSON.stringify({offers: ['favourite-mark']})
      )

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({
        _tag: 'ready',
        encryptionKeySource: 'existing',
        migratedPlaintextKeyCount: 3,
      })
      expect(opened.store.getAllKeys().sort()).toEqual([
        'chatTagsState',
        'offers',
        'session:v2SecretWasWritten',
      ])
      expect(existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)).toBe(true)
      expect(createMMKV({id: LEGACY_PLAINTEXT_MMKV_ID}).length).toBe(0)
    })

    it('skips the import on later launches once the plaintext store is empty', () => {
      seedLegacyPlaintextStore()
      openEncryptedMmkvStorage()
      deletedFiles.length = 0

      const laterLaunch = openEncryptedMmkvStorage()

      expect(laterLaunch.status).toMatchObject({
        migratedPlaintextKeyCount: 0,
      })
      expect(laterLaunch.store.getString('offers')).toBe(
        JSON.stringify({offers: ['favourite-mark']})
      )
    })
  })

  describe('missing, locked or corrupted key', () => {
    function seedCiphertextWithoutKey(): void {
      const previousLaunch = openEncryptedMmkvStorage()
      previousLaunch.store.set('messagingState', '{"inboxes":[]}')
      secureStoreMock.resetMockSecureStore()
      jest.clearAllMocks()
    }

    it('locks instead of re-keying when ciphertext exists, the key is gone and a session secret remains', () => {
      seedCiphertextWithoutKey()
      SecureStore.setItem(SECRET_TOKEN_KEY_V2, 'session-secret')

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({_tag: 'locked'})
      expect(isPlaceholderStore(opened.store)).toBe(true)
      expect(storedEncryptionKey()).toBeNull()
      expect(existsMMKV(ENCRYPTED_MMKV_ID)).toBe(true)
      expect(deleteMMKV).not.toHaveBeenCalled()
    })

    it('locks when only the legacy session secret remains', () => {
      seedCiphertextWithoutKey()
      SecureStore.setItem(SECRET_TOKEN_KEY, 'legacy-session-secret')

      expect(openEncryptedMmkvStorage().status).toEqual({_tag: 'locked'})
    })

    it('discards unreadable ciphertext and re-keys when no session secret exists (restored backup)', () => {
      seedCiphertextWithoutKey()

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({
        _tag: 'ready',
        encryptionKeySource: 'regeneratedAfterKeyLoss',
        migratedPlaintextKeyCount: undefined,
      })
      expect(deleteMMKV).toHaveBeenCalledWith(ENCRYPTED_MMKV_ID)
      expect(opened.store.getString('messagingState')).toBeUndefined()
      expect(opened.store.isEncrypted).toBe(true)
      expect(storedEncryptionKey()).toHaveLength(32)
    })

    it('fails closed without touching storage when the key cannot be read', () => {
      seedCiphertextWithoutKey()
      const keychainError = new Error('keychain interaction not allowed')
      secureStoreGetItem.mockImplementationOnce(() => {
        throw keychainError
      })

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({
        _tag: 'unavailable',
        cause: keychainError,
      })
      expect(isPlaceholderStore(opened.store)).toBe(true)
      expect(secureStoreSetItem).not.toHaveBeenCalled()
      expect(deleteMMKV).not.toHaveBeenCalled()
      expect(existsMMKV(ENCRYPTED_MMKV_ID)).toBe(true)
    })

    it('fails closed when the new key cannot be persisted', () => {
      const keychainError = new Error('keychain write failed')
      secureStoreSetItem.mockImplementationOnce(() => {
        throw keychainError
      })

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({
        _tag: 'unavailable',
        cause: keychainError,
      })
      expect(existsMMKV(ENCRYPTED_MMKV_ID)).toBe(false)
    })

    it('fails closed when the unreadable ciphertext cannot be deleted', () => {
      seedCiphertextWithoutKey()
      jest.mocked(deleteMMKV).mockReturnValueOnce(false)

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toMatchObject({_tag: 'unavailable'})
      expect(storedEncryptionKey()).toBeNull()
    })
  })
})
