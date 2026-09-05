import AsyncStorage from '@react-native-async-storage/async-storage'
import {Schema} from 'effect'
import {createStore} from 'jotai'
import {AppState} from 'react-native'
import {
  atomWithParsedMmkvStorage,
  flushAllScheduledMmkvWrites,
} from '../atomUtils/atomWithParsedMmkvStorage'
import clearMmkvStorageAndEmptyAtoms from '../clearMmkvStorageAndEmptyAtoms'
import reportError from '../reportError'
import {
  CRITICAL_KEYS_PRESENCE_RECORD_KEY,
  FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
  STORED_CLUBS_V2_MMKV_KEY,
  VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
} from './criticalMmkvKeys'
import {detectMmkvDataLoss} from './detectMmkvDataLoss'
import * as effectMmkv from './effectMmkv'
import {storage} from './effectMmkv'
import {
  ASYNC_SENTINEL_KEY,
  recordCriticalMmkvKeyPersisted,
} from './mmkvDataLossDiagnosticStorage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

jest.mock('../reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('expo-file-system', () => ({
  Paths: {document: '/mock/documents'},
  File: jest.fn().mockImplementation((_dir: string, path: string) => ({
    exists: path.endsWith('.crc'),
    size: path.endsWith('.crc') ? 128 : 4096,
  })),
}))

jest.mock('react-native-mmkv')

const mockedAsyncStorage = jest.mocked(AsyncStorage)
const mockedReportError = jest.mocked(reportError)

const TestValueSchema = Schema.Struct({value: Schema.String})
const defaultValue = {value: 'default'}

async function flushDetection(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  storage._storage.clearAll()
  jest.restoreAllMocks()
  jest.clearAllMocks()
  mockedAsyncStorage.getItem.mockResolvedValue(null)
  mockedAsyncStorage.setItem.mockResolvedValue(undefined)
  mockedAsyncStorage.removeItem.mockResolvedValue(undefined)
})

describe('detectMmkvDataLoss', () => {
  it('reports a locked store and skips loss detection instead of misreporting the placeholder as a wipe', async () => {
    jest
      .spyOn(effectMmkv, 'getMmkvStorageStatus')
      .mockReturnValue({_tag: 'locked'})
    mockedAsyncStorage.getItem.mockImplementation(async (key) =>
      key === ASYNC_SENTINEL_KEY ? '1700000000000' : null
    )

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message:
          'MMKV storage is locked: encryption key is missing while a session secret exists',
      }),
      expect.objectContaining({appState: AppState.currentState})
    )
    expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled()
    expect(storage._storage.getAllKeys()).toEqual([])
  })

  it('reports a completed plaintext migration at info level', async () => {
    jest.spyOn(effectMmkv, 'getMmkvStorageStatus').mockReturnValue({
      _tag: 'ready',
      encryptionKeySource: 'generated',
      migratedPlaintextKeyCount: 12,
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(
      'info',
      expect.objectContaining({
        message: 'MMKV storage migrated from plaintext to encrypted',
      }),
      {migratedPlaintextKeyCount: 12, encryptionKeySource: 'generated'}
    )
  })

  it('warns when unreadable ciphertext was reset after key loss', async () => {
    jest.spyOn(effectMmkv, 'getMmkvStorageStatus').mockReturnValue({
      _tag: 'ready',
      encryptionKeySource: 'regeneratedAfterKeyLoss',
      migratedPlaintextKeyCount: undefined,
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(
      'warn',
      expect.objectContaining({
        message:
          'MMKV encryption key was missing; unreadable encrypted storage was reset because no session secret exists',
      }),
      {encryptionKeySource: 'regeneratedAfterKeyLoss'}
    )
  })

  it('reports partial data loss when a previously present critical key disappears', async () => {
    storage._storage.set('__mmkv_data_exists', '1700000000000')
    storage._storage.set('messagingState', '{}')
    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) return '1700000000000'
      if (key === CRITICAL_KEYS_PRESENCE_RECORD_KEY) {
        return JSON.stringify({
          presentKeys: ['messagingState', 'offers'],
        })
      }
      return null
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message:
          'MMKV partial data loss detected: critical keys disappeared since last launch',
      }),
      expect.objectContaining({
        disappearedKeys: ['offers'],
        remainingKeyCount: 2,
        appState: AppState.currentState,
        dataFileExists: expect.any(Boolean),
      })
    )
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY,
      JSON.stringify({presentKeys: ['messagingState']})
    )
  })

  it('reports partial loss instead of a total wipe when MMKV still has keys', async () => {
    storage._storage.set('offers', '{}')
    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) return '1700000000000'
      if (key === CRITICAL_KEYS_PRESENCE_RECORD_KEY) {
        return JSON.stringify({
          presentKeys: ['messagingState', 'offers'],
        })
      }
      return null
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message:
          'MMKV partial data loss detected: critical keys disappeared since last launch',
      }),
      expect.objectContaining({
        disappearedKeys: ['messagingState'],
      })
    )
  })

  it.each([
    STORED_CLUBS_V2_MMKV_KEY,
    FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
    VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
  ])('reports partial data loss when %s disappears', async (key) => {
    storage._storage.set('__mmkv_data_exists', '1700000000000')
    mockedAsyncStorage.getItem.mockImplementation(async (storageKey) => {
      if (storageKey === ASYNC_SENTINEL_KEY) return '1700000000000'
      if (storageKey === CRITICAL_KEYS_PRESENCE_RECORD_KEY) {
        return JSON.stringify({presentKeys: [key]})
      }
      return null
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message:
          'MMKV partial data loss detected: critical keys disappeared since last launch',
      }),
      expect.objectContaining({disappearedKeys: [key]})
    )
  })

  it('does not report partial data loss when the critical-keys record is missing', async () => {
    storage._storage.set('__mmkv_data_exists', '1700000000000')
    storage._storage.set('offers', '{}')
    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) return '1700000000000'
      return null
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).not.toHaveBeenCalled()
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY,
      JSON.stringify({presentKeys: ['offers']})
    )
  })

  it('skips partial data loss reporting when a total wipe was reported in the same launch', async () => {
    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) return '1700000000000'
      if (key === CRITICAL_KEYS_PRESENCE_RECORD_KEY) {
        return JSON.stringify({
          presentKeys: ['messagingState', 'offers'],
        })
      }
      return null
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message:
          'MMKV data loss detected: data was previously stored but MMKV is now empty',
      }),
      expect.any(Object)
    )
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY,
      JSON.stringify({presentKeys: []})
    )
  })

  it('does not report partial data loss after an intentional storage clear removes the record', async () => {
    storage._storage.set('messagingState', '{}')
    storage._storage.set('offers', '{}')
    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) return '1700000000000'
      if (key === CRITICAL_KEYS_PRESENCE_RECORD_KEY) {
        return JSON.stringify({
          presentKeys: ['messagingState', 'offers'],
        })
      }
      return null
    })

    await clearMmkvStorageAndEmptyAtoms()
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY
    )

    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) return null
      if (key === CRITICAL_KEYS_PRESENCE_RECORD_KEY) return null
      return null
    })

    detectMmkvDataLoss()
    await flushDetection()

    expect(mockedReportError).not.toHaveBeenCalled()
  })

  it('keeps every critical key recorded by concurrent successful persists', async () => {
    const storedValues = new Map<string, string>()
    mockedAsyncStorage.getItem.mockImplementation(
      async (key) => storedValues.get(key) ?? null
    )
    mockedAsyncStorage.setItem.mockImplementation(async (key, value) => {
      storedValues.set(key, value)
    })

    await Promise.all([
      recordCriticalMmkvKeyPersisted('messagingState'),
      recordCriticalMmkvKeyPersisted('offers'),
      recordCriticalMmkvKeyPersisted(STORED_CLUBS_V2_MMKV_KEY),
      recordCriticalMmkvKeyPersisted(FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY),
      recordCriticalMmkvKeyPersisted(VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY),
    ])

    expect(storedValues.get(CRITICAL_KEYS_PRESENCE_RECORD_KEY)).toBe(
      JSON.stringify({
        presentKeys: [
          'messagingState',
          'offers',
          STORED_CLUBS_V2_MMKV_KEY,
          FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
          VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
        ],
      })
    )
  })

  it('clears MMKV immediately and blocks atom writes until diagnostic cleanup finishes', async () => {
    const key = 'test-clear-lifetime'
    storage._storage.set(key, JSON.stringify({value: 'existing-sensitive'}))
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsubscribe = store.sub(testAtom, () => {})
    let finishSentinelRemoval: (() => void) | undefined
    mockedAsyncStorage.removeItem.mockImplementation(async (key) => {
      if (key === ASYNC_SENTINEL_KEY) {
        await new Promise<void>((resolve) => {
          finishSentinelRemoval = resolve
        })
      }
    })

    const clearPromise = clearMmkvStorageAndEmptyAtoms()
    await flushDetection()

    expect(finishSentinelRemoval).toBeDefined()
    expect(storage._storage.getString(key)).toBeUndefined()
    expect(store.get(testAtom)).toEqual(defaultValue)

    store.set(testAtom, {value: 'queued-during-clear'})
    expect(storage._storage.getString(key)).toBeUndefined()

    finishSentinelRemoval?.()
    await clearPromise
    flushAllScheduledMmkvWrites()

    expect(storage._storage.getString(key)).toBeUndefined()
    unsubscribe()
  })

  it('keeps MMKV cleared when best-effort diagnostic cleanup fails', async () => {
    storage._storage.set(
      'sensitive-test-value',
      JSON.stringify({value: 'must-be-cleared'})
    )
    mockedAsyncStorage.removeItem.mockRejectedValue(
      new Error('AsyncStorage unavailable')
    )

    await expect(clearMmkvStorageAndEmptyAtoms()).resolves.toBeUndefined()

    expect(storage._storage.getAllKeys()).toEqual([])
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(
      ASYNC_SENTINEL_KEY
    )
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(
      CRITICAL_KEYS_PRESENCE_RECORD_KEY
    )
  })

  it('cancels an in-flight loss check when an intentional clear begins', async () => {
    storage._storage.set('__mmkv_data_exists', '1700000000000')
    let finishSentinelRead: (() => void) | undefined
    let didBlockSentinelRead = false
    mockedAsyncStorage.getItem.mockImplementation(async (key) => {
      if (key !== ASYNC_SENTINEL_KEY) return null

      if (!didBlockSentinelRead) {
        didBlockSentinelRead = true
        await new Promise<void>((resolve) => {
          finishSentinelRead = resolve
        })
      }
      return '1700000000000'
    })

    detectMmkvDataLoss()
    await flushDetection()
    expect(finishSentinelRead).toBeDefined()

    const clearPromise = clearMmkvStorageAndEmptyAtoms()
    expect(storage._storage.getAllKeys()).toEqual([])

    finishSentinelRead?.()
    await clearPromise

    expect(mockedReportError).not.toHaveBeenCalled()
  })
})
