import {createHash} from 'crypto'
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
let mockUnlinkFails = false
// Simulated `Documents/mmkv/`: MMKV data/crc files mirror the mmkv mock's
// registry (so unlinking one removes it from `existsMMKV`), and any other
// file (the key fingerprint) keeps its written content.
const mockWrittenFiles = new Map<string, string>()
// `.crc` twins outlive the data file's registry entry until unlinked themselves.
const mockOrphanedCrcIds = new Set<string>()
jest.mock('expo-file-system', () => ({
  Paths: {document: '/mock/documents'},
  File: jest.fn().mockImplementation((_dir: string, path: string) => {
    const mmkvId = path.replace(/^mmkv\//, '').replace(/\.crc$/, '')
    const isMmkvFile =
      /^mmkv\/[^.]+(\.crc)?$|^mmkv\/mmkv\.[a-z]+(\.crc)?$/.test(path)
    const mmkv = jest.requireMock<{
      existsMMKV: (id: string) => boolean
      deleteMMKV: (id: string) => boolean
    }>('react-native-mmkv')
    return {
      get exists(): boolean {
        if (!isMmkvFile) return mockWrittenFiles.has(path)
        if (path.endsWith('.crc') && mockOrphanedCrcIds.has(mmkvId)) return true
        return mmkv.existsMMKV(mmkvId)
      },
      textSync: () => {
        const content = mockWrittenFiles.get(path)
        if (content === undefined) throw new Error(`no such file ${path}`)
        return content
      },
      create: () => {
        mockWrittenFiles.set(path, '')
      },
      write: (content: string) => {
        mockWrittenFiles.set(path, content)
      },
      delete: () => {
        if (mockUnlinkFails) throw new Error('unlink failed')
        deletedFiles.push(path)
        mockWrittenFiles.delete(path)
        if (!isMmkvFile) return
        if (path.endsWith('.crc')) mockOrphanedCrcIds.delete(mmkvId)
        else {
          mmkv.deleteMMKV(mmkvId)
          mockOrphanedCrcIds.add(mmkvId)
        }
      },
    }
  }),
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
  mockUnlinkFails = false
  mockWrittenFiles.clear()
  mockOrphanedCrcIds.clear()
  jest.clearAllMocks()
})

const KEY_FINGERPRINT_FILE = `mmkv/${ENCRYPTED_MMKV_ID}.key-id`

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

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
    expect(mockWrittenFiles.get(KEY_FINGERPRINT_FILE)).toBe(
      sha256Hex(key ?? '')
    )
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

      expect(deletedFiles).toEqual([
        `mmkv/${LEGACY_PLAINTEXT_MMKV_ID}`,
        `mmkv/${LEGACY_PLAINTEXT_MMKV_ID}.crc`,
      ])
      expect(existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)).toBe(false)
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
      expect(existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)).toBe(false)
    })

    it('keeps an emptied plaintext store harmless when unlinking it fails', () => {
      seedLegacyPlaintextStore()
      mockUnlinkFails = true
      const migratingLaunch = openEncryptedMmkvStorage()
      mockUnlinkFails = false

      expect(migratingLaunch.status).toMatchObject({
        _tag: 'ready',
        migratedPlaintextKeyCount: 3,
      })
      expect(existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)).toBe(true)
      expect(createMMKV({id: LEGACY_PLAINTEXT_MMKV_ID}).length).toBe(0)

      const laterLaunch = openEncryptedMmkvStorage()

      expect(laterLaunch.status).toMatchObject({
        migratedPlaintextKeyCount: 0,
      })
      expect(existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)).toBe(false)
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

    it('locks when the stored key does not match the fingerprint of the ciphertext and a session secret exists', () => {
      const original = openEncryptedMmkvStorage()
      original.store.set('messagingState', '{"inboxes":[]}')
      const otherInstallsKey = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
      SecureStore.setItem(MMKV_ENCRYPTION_KEY, otherInstallsKey)
      SecureStore.setItem(SECRET_TOKEN_KEY_V2, 'session-secret')
      jest.clearAllMocks()

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({_tag: 'locked'})
      expect(createMMKV).not.toHaveBeenCalled()
      expect(deleteMMKV).not.toHaveBeenCalled()
      expect(storedEncryptionKey()).toBe(otherInstallsKey)
      expect(mockWrittenFiles.get(KEY_FINGERPRINT_FILE)).not.toBe(
        sha256Hex(otherInstallsKey)
      )
    })

    it('discards the ciphertext and re-keys on a key mismatch when no session secret exists', () => {
      openEncryptedMmkvStorage().store.set('messagingState', '{"inboxes":[]}')
      const otherInstallsKey = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
      SecureStore.setItem(MMKV_ENCRYPTION_KEY, otherInstallsKey)
      jest.clearAllMocks()

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toEqual({
        _tag: 'ready',
        encryptionKeySource: 'regeneratedAfterKeyMismatch',
        migratedPlaintextKeyCount: undefined,
      })
      expect(deleteMMKV).toHaveBeenCalledWith(ENCRYPTED_MMKV_ID)
      expect(opened.store.getString('messagingState')).toBeUndefined()
      const newKey = storedEncryptionKey()
      expect(newKey).not.toBe(otherInstallsKey)
      expect(mockWrittenFiles.get(KEY_FINGERPRINT_FILE)).toBe(
        sha256Hex(newKey ?? '')
      )
    })

    it('trusts the stored key and records its fingerprint when no fingerprint file exists', () => {
      openEncryptedMmkvStorage().store.set('messagingState', '{"inboxes":[]}')
      const key = storedEncryptionKey()
      mockWrittenFiles.delete(KEY_FINGERPRINT_FILE)

      const opened = openEncryptedMmkvStorage()

      expect(opened.status).toMatchObject({encryptionKeySource: 'existing'})
      expect(opened.store.getString('messagingState')).toBe('{"inboxes":[]}')
      expect(mockWrittenFiles.get(KEY_FINGERPRINT_FILE)).toBe(
        sha256Hex(key ?? '')
      )
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
