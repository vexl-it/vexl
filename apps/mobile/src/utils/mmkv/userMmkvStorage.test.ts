import {KeyHolder} from '@vexl-next/cryptography'
import {Schema} from 'effect'
import {createMMKV} from 'react-native-mmkv'
import {plaintextStorage, storage, USER_MMKV_ID} from './effectMmkv'
import {InMemoryMmkvStore} from './mmkvStore'
import {SessionBoundMmkvStore} from './sessionBoundMmkvStore'
import {bindUserMmkvStorage, deleteUserMmkvStorage} from './userMmkvStorage'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

const decodeKeyHolder = Schema.decodeUnknownSync(KeyHolder.PrivateKeyHolder)
const sessionA = {
  privateKey: decodeKeyHolder({
    privateKeyPemBase64: 'private-key-a',
    publicKeyPemBase64: 'public-key-a',
  }),
}
const sessionB = {
  privateKey: decodeKeyHolder({
    privateKeyPemBase64: 'private-key-b',
    publicKeyPemBase64: 'public-key-b',
  }),
}

const mockedCreateMMKV = jest.mocked(createMMKV)

beforeEach(() => {
  deleteUserMmkvStorage()
  plaintextStorage._storage.clearAll()
  jest.clearAllMocks()
})

describe('bindUserMmkvStorage', () => {
  it('opens an AES-256 store whose key is derived from the session', () => {
    bindUserMmkvStorage(sessionA)

    expect(mockedCreateMMKV).toHaveBeenCalledWith(
      expect.objectContaining({
        id: USER_MMKV_ID,
        encryptionType: 'AES-256',
        encryptionKey: expect.stringMatching(/^[A-Za-z0-9+/]{32}$/),
      })
    )
    expect(storage._storage.isEncrypted).toBe(true)
  })

  it('is a no-op when the same session is already bound', () => {
    bindUserMmkvStorage(sessionA)
    bindUserMmkvStorage(sessionA)
    expect(mockedCreateMMKV).toHaveBeenCalledTimes(1)
  })

  it('derives the same key for the same session across launches', () => {
    bindUserMmkvStorage(sessionA)
    storage._storage.set('chats', 'value')
    const firstKey = mockedCreateMMKV.mock.calls[0]?.[0]?.encryptionKey

    // Fresh JS state, files still on disk.
    storage._storage.set('chats', 'value')
    bindUserMmkvStorage(sessionB)
    bindUserMmkvStorage(sessionA)

    expect(mockedCreateMMKV.mock.calls.at(-1)?.[0]?.encryptionKey).toBe(
      firstKey
    )
  })

  it('does not expose one user data to another session', () => {
    bindUserMmkvStorage(sessionA)
    storage._storage.set('chats', 'a-chats')

    bindUserMmkvStorage(sessionB)
    expect(storage._storage.getString('chats')).toBeUndefined()
  })

  it('keeps writes made before the session was known', () => {
    storage._storage.set('marketplaceReadyNotification', 'pending')

    bindUserMmkvStorage(sessionA)
    expect(storage._storage.getString('marketplaceReadyNotification')).toBe(
      'pending'
    )
  })

  it('notifies listeners for every stored key so mounted atoms re-read', () => {
    const onDisk = new InMemoryMmkvStore(true)
    onDisk.set('offers', 'value')
    const proxy = new SessionBoundMmkvStore()
    const listener = jest.fn()
    proxy.addOnValueChangedListener(listener)

    proxy.bind(onDisk)

    expect(listener).toHaveBeenCalledWith('offers')
    expect(proxy.getString('offers')).toBe('value')
  })

  describe('migration from the plaintext store', () => {
    it('moves user entries and leaves pre-login entries in place', () => {
      plaintextStorage._storage.set('preferences', '{"isDeveloper":true}')
      plaintextStorage._storage.set('storedContacts', '[1,2]')
      plaintextStorage._storage.set('session:v2SecretWasWritten', true)
      plaintextStorage._storage.set('hideForMessage-1', true)

      bindUserMmkvStorage(sessionA)

      expect(storage._storage.getString('storedContacts')).toBe('[1,2]')
      expect(storage._storage.getBoolean('hideForMessage-1')).toBe(true)
      expect(storage._storage.contains('preferences')).toBe(false)
      expect(plaintextStorage._storage.getAllKeys().sort()).toEqual([
        'preferences',
        'session:v2SecretWasWritten',
      ])
    })

    it('runs only once', () => {
      plaintextStorage._storage.set('storedContacts', '[1]')
      bindUserMmkvStorage(sessionA)
      storage._storage.set('storedContacts', '[1,2]')

      deleteUserMmkvStorage()
      bindUserMmkvStorage(sessionA)
      expect(storage._storage.getString('storedContacts')).toBeUndefined()
      expect(plaintextStorage._storage.contains('storedContacts')).toBe(false)
    })
  })
})

describe('deleteUserMmkvStorage', () => {
  it('removes the store files and detaches storage', () => {
    bindUserMmkvStorage(sessionA)
    storage._storage.set('chats', 'value')

    deleteUserMmkvStorage()
    expect(storage._storage.isEncrypted).toBe(false)
    expect(storage._storage.getString('chats')).toBeUndefined()

    bindUserMmkvStorage(sessionA)
    expect(storage._storage.getString('chats')).toBeUndefined()
  })
})
