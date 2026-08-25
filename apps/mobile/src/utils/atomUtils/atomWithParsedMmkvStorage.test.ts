import {Schema} from 'effect'
import {createStore} from 'jotai'
import {
  FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
  STORED_CLUBS_V2_MMKV_KEY,
  VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
} from '../mmkv/criticalMmkvKeys'
import {storage} from '../mmkv/effectMmkv'
import {recordCriticalMmkvKeyPersisted} from '../mmkv/mmkvDataLossDiagnosticStorage'
import reportError from '../reportError'
import {
  CLEAR_STORAGE_KEY,
  atomWithParsedMmkvStorage,
  atomWithParsedMmkvStorageWithImmediateSaveOption,
  beginMmkvStorageClear,
  flushAllScheduledMmkvWrites,
  invalidateScheduledMmkvWrites,
} from './atomWithParsedMmkvStorage'

const mockedReportError = jest.mocked(reportError)
const mockedRecordCriticalMmkvKeyPersisted = jest.mocked(
  recordCriticalMmkvKeyPersisted
)

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

jest.mock('../mmkv/mmkvDataLossDiagnosticStorage', () => ({
  recordCriticalMmkvKeyPersisted: jest.fn(async () => undefined),
}))

jest.mock('react-native-mmkv')

const TestValueSchema = Schema.Struct({
  name: Schema.String,
  count: Schema.Number,
})
type TestValue = typeof TestValueSchema.Type

const defaultValue: TestValue = {name: 'default', count: 0}

let idleCallbackQueue: IdleRequestCallback[] = []
let idleCallbackHandle = 0
let hadRequestIdleCallback = false
let originalRequestIdleCallback:
  | typeof globalThis.requestIdleCallback
  | undefined

const idleDeadline: IdleDeadline = {
  didTimeout: false,
  timeRemaining: () => 50,
}

function flushIdleCallbacks(): void {
  while (idleCallbackQueue.length > 0) {
    const callback = idleCallbackQueue.shift()
    if (callback) callback(idleDeadline)
  }
}

beforeEach(() => {
  idleCallbackQueue = []
  idleCallbackHandle = 0
  storage._storage.clearAll()
  jest.clearAllMocks()
  hadRequestIdleCallback = 'requestIdleCallback' in globalThis
  originalRequestIdleCallback = hadRequestIdleCallback
    ? globalThis.requestIdleCallback
    : undefined

  const requestIdleCallbackStub = (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ): number => {
    void options
    idleCallbackQueue.push(callback)
    idleCallbackHandle += 1
    return idleCallbackHandle
  }

  globalThis.requestIdleCallback = requestIdleCallbackStub
})

afterEach(() => {
  if (hadRequestIdleCallback && originalRequestIdleCallback !== undefined) {
    globalThis.requestIdleCallback = originalRequestIdleCallback
  } else {
    Reflect.deleteProperty(globalThis, 'requestIdleCallback')
  }
  originalRequestIdleCallback = undefined
  jest.restoreAllMocks()
})

describe('atomWithParsedMmkvStorage', () => {
  it('initializes from the value stored in mmkv', () => {
    const key = 'test-init-from-storage'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))

    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual({name: 'stored', count: 1})
  })

  it('initializes with the default value when nothing is stored', () => {
    const key = 'test-init-default'

    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual(defaultValue)
  })

  it('initializes with the default value when the stored value does not parse', () => {
    const key = 'test-init-parse-error'
    storage._storage.set(key, 'not json at all')

    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual(defaultValue)
    expect(mockedReportError).toHaveBeenCalledWith(
      'warn',
      expect.objectContaining({
        _tag: 'StoredValueParseError',
        message: expect.stringContaining(`Key: ${key}`),
        key,
        errorTag: expect.any(String),
        rawValueLength: 'not json at all'.length,
        rawValueIsValidJson: false,
      }),
      expect.objectContaining({key, errorTag: expect.any(String)})
    )
  })

  it.each([
    'offers',
    STORED_CLUBS_V2_MMKV_KEY,
    FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
    VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
  ])(
    'reports a %s parse failure at error level during initialization',
    (key) => {
      storage._storage.set(key, 'not json at all')

      const testAtom = atomWithParsedMmkvStorage(
        key,
        defaultValue,
        TestValueSchema
      )
      const store = createStore()

      expect(store.get(testAtom)).toEqual(defaultValue)
      expect(mockedReportError).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          _tag: 'StoredValueParseError',
          message: expect.stringContaining(`Key: ${key}`),
          key,
          errorTag: expect.any(String),
          rawValueLength: 'not json at all'.length,
          rawValueIsValidJson: false,
        }),
        expect.objectContaining({
          key,
          errorTag: expect.any(String),
          rawValueLength: 'not json at all'.length,
          rawValueIsValidJson: false,
        })
      )
    }
  )

  it('reports critical-key parse failures at error level in the onChange listener', () => {
    const key = 'messagingState'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.set(key, 'not json at all')
    flushIdleCallbacks()

    expect(mockedReportError).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        _tag: 'StoredValueParseError',
        message: expect.stringContaining("Key: 'messagingState'"),
        key,
        errorTag: expect.any(String),
        rawValueLength: 'not json at all'.length,
        rawValueIsValidJson: false,
      }),
      expect.objectContaining({
        key,
        errorTag: expect.any(String),
        rawValueLength: 'not json at all'.length,
        rawValueIsValidJson: false,
      })
    )
    unsub()
  })

  it('still reads blobs written by the old format (embedded ___author_id)', () => {
    const key = 'test-legacy-author-id'
    storage._storage.set(
      key,
      JSON.stringify({name: 'legacy', count: 2, ___author_id: 'atom123'})
    )

    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual({name: 'legacy', count: 2})
  })

  it('persists writes after an idle callback and coalesces queued writes to the newest value', () => {
    const key = 'test-coalesce-writes'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    const setSpy = jest.spyOn(storage._storage, 'set')

    store.set(testAtom, {name: 'v1', count: 1})
    store.set(testAtom, {name: 'v2', count: 2})
    store.set(testAtom, {name: 'v3', count: 3})

    // nothing persisted before the deferred flush ran
    expect(storage._storage.getString(key)).toBeUndefined()
    expect(store.get(testAtom)).toEqual({name: 'v3', count: 3})

    flushIdleCallbacks()

    // last-write-wins: only the newest value was written, exactly once
    expect(setSpy).toHaveBeenCalledTimes(1)
    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'v3',
      count: 3,
    })
  })

  it('does not write the ___author_id field anymore', () => {
    const key = 'test-no-author-id'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    store.set(testAtom, {name: 'clean', count: 1})
    flushIdleCallbacks()

    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'clean',
      count: 1,
    })
  })

  it.each([
    'offers',
    STORED_CLUBS_V2_MMKV_KEY,
    FCM_CYPHER_TO_KEY_HOLDER_MMKV_KEY,
    VEXL_TOKEN_TO_KEY_HOLDER_MMKV_KEY,
  ])('records a successful deferred persist of %s', (key) => {
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    store.set(testAtom, {name: 'persisted', count: 1})
    flushIdleCallbacks()

    expect(mockedRecordCriticalMmkvKeyPersisted).toHaveBeenCalledTimes(1)
    expect(mockedRecordCriticalMmkvKeyPersisted).toHaveBeenCalledWith(key)
  })

  it('records a successful immediate persist of a critical key', () => {
    const key = 'messagingState'
    const {setAndSaveImmediatelyAtom} =
      atomWithParsedMmkvStorageWithImmediateSaveOption(
        key,
        defaultValue,
        TestValueSchema
      )
    const store = createStore()

    store.set(setAndSaveImmediatelyAtom, {name: 'persisted', count: 1})

    expect(mockedRecordCriticalMmkvKeyPersisted).toHaveBeenCalledTimes(1)
    expect(mockedRecordCriticalMmkvKeyPersisted).toHaveBeenCalledWith(key)
  })

  it('does not record successful persists of noncritical keys', () => {
    const key = 'test-noncritical-persist'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    store.set(testAtom, {name: 'persisted', count: 1})
    flushIdleCallbacks()

    expect(mockedRecordCriticalMmkvKeyPersisted).not.toHaveBeenCalled()
  })

  it('does not record a failed persist of a critical key', () => {
    const key = 'offers'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    jest.spyOn(storage._storage, 'set').mockImplementationOnce(() => {
      throw new Error('write failed')
    })

    store.set(testAtom, {name: 'not-persisted', count: 1})
    flushIdleCallbacks()

    expect(mockedRecordCriticalMmkvKeyPersisted).not.toHaveBeenCalled()
  })

  it('does not feed its own write back through the change listener', () => {
    const key = 'test-own-write-ignored'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    const written: TestValue = {name: 'own', count: 5}
    store.set(testAtom, written)
    flushIdleCallbacks()

    // identity preserved — the listener did not re-decode & set the value
    expect(store.get(testAtom)).toBe(written)
    unsub()
  })

  it('picks up foreign writes from another atom for the same key', () => {
    const key = 'test-foreign-atom-write'
    const atomA = atomWithParsedMmkvStorage(key, defaultValue, TestValueSchema)
    const atomB = atomWithParsedMmkvStorage(key, defaultValue, TestValueSchema)
    const store = createStore()
    const unsub = store.sub(atomA, () => {})

    store.set(atomB, {name: 'fromB', count: 7})
    flushIdleCallbacks()

    expect(store.get(atomA)).toEqual({name: 'fromB', count: 7})
    unsub()
  })

  it('picks up direct storage writes while mounted', () => {
    const key = 'test-direct-storage-write'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.set(key, JSON.stringify({name: 'direct', count: 9}))
    flushIdleCallbacks()

    expect(store.get(testAtom)).toEqual({name: 'direct', count: 9})
    unsub()
  })

  it('resets to the default value when the key is deleted', () => {
    const key = 'test-delete-key'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.remove(key)
    flushIdleCallbacks()

    expect(store.get(testAtom)).toEqual(defaultValue)
    unsub()
  })

  it('resets to the default value when the clear-storage key is written', () => {
    const key = 'test-clear-storage'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())

    expect(store.get(testAtom)).toEqual(defaultValue)
    unsub()
  })

  it('drops a write scheduled before a storage clear so it cannot resurrect cleared data', () => {
    const key = 'test-clear-invalidates-pending-write'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    // a sensitive value is written but its deferred flush has not run yet
    store.set(testAtom, {name: 'sensitive', count: 42})
    expect(storage._storage.getString(key)).toBeUndefined()

    // logout / wipe happens before the flush runs — mirrors the sequence in
    // clearMmkvStorageAndEmptyAtoms: signal clear, invalidate pending writes,
    // then wipe storage
    storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())
    invalidateScheduledMmkvWrites()
    storage._storage.clearAll()

    // the deferred flush now runs — it must NOT write the old value back
    flushIdleCallbacks()

    expect(storage._storage.getString(key)).toBeUndefined()
    expect(store.get(testAtom)).toEqual(defaultValue)
    unsub()
  })

  it('still persists writes scheduled after a storage clear', () => {
    const key = 'test-write-after-clear'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())
    invalidateScheduledMmkvWrites()
    storage._storage.clearAll()

    // a write made after the clear must persist normally
    store.set(testAtom, {name: 'after', count: 1})
    flushIdleCallbacks()

    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'after',
      count: 1,
    })
    unsub()
  })

  it('flushNow persists the pending value synchronously, before the deferred flush', () => {
    const key = 'test-flush-now'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    const setSpy = jest.spyOn(storage._storage, 'set')

    store.set(testAtom, {name: 'flushed', count: 3})
    // not persisted yet — the deferred flush has not run
    expect(storage._storage.getString(key)).toBeUndefined()

    testAtom.flushNow()

    // written immediately, without waiting for the idle callback
    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'flushed',
      count: 3,
    })
    expect(setSpy).toHaveBeenCalledTimes(1)

    // the already-scheduled deferred flush is now a no-op (nothing pending)
    flushIdleCallbacks()
    expect(setSpy).toHaveBeenCalledTimes(1)
  })

  it('flushNow is a no-op when there is nothing pending', () => {
    const key = 'test-flush-now-nothing-pending'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    createStore()

    const setSpy = jest.spyOn(storage._storage, 'set')

    testAtom.flushNow()

    expect(setSpy).not.toHaveBeenCalled()
    expect(storage._storage.getString(key)).toBeUndefined()
  })

  it('registers the global flush callback only while a write is pending', () => {
    const key = 'test-pending-flush-registration'
    const addSpy = jest.spyOn(Set.prototype, 'add')
    const deleteSpy = jest.spyOn(Set.prototype, 'delete')
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    expect(addSpy).not.toHaveBeenCalledWith(testAtom.flushNow)

    store.set(testAtom, {name: 'v1', count: 1})
    expect(addSpy).toHaveBeenCalledWith(testAtom.flushNow)

    addSpy.mockClear()
    store.set(testAtom, {name: 'v2', count: 2})
    expect(addSpy).not.toHaveBeenCalledWith(testAtom.flushNow)

    flushIdleCallbacks()
    expect(deleteSpy).toHaveBeenCalledWith(testAtom.flushNow)

    const iteratorSpy = jest.spyOn(Set.prototype, Symbol.iterator)
    flushAllScheduledMmkvWrites()

    expect(iteratorSpy).toHaveBeenCalledTimes(1)
    expect(iteratorSpy.mock.instances[0]).toHaveProperty('size', 0)
  })

  it('removes a synchronously flushed callback from the global registry', () => {
    const key = 'test-flush-now-removes-registration'
    const deleteSpy = jest.spyOn(Set.prototype, 'delete')
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    store.set(testAtom, {name: 'pending', count: 1})
    testAtom.flushNow()

    expect(deleteSpy).toHaveBeenCalledWith(testAtom.flushNow)

    const iteratorSpy = jest.spyOn(Set.prototype, Symbol.iterator)
    flushAllScheduledMmkvWrites()

    expect(iteratorSpy).toHaveBeenCalledTimes(1)
    expect(iteratorSpy.mock.instances[0]).toHaveProperty('size', 0)
  })

  it('discards invalidated callbacks immediately', () => {
    const key = 'test-invalidation-removes-registration'
    const deleteSpy = jest.spyOn(Set.prototype, 'delete')
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    store.set(testAtom, {name: 'sensitive', count: 42})
    invalidateScheduledMmkvWrites()

    expect(deleteSpy).toHaveBeenCalledWith(testAtom.flushNow)
    expect(storage._storage.getString(key)).toBeUndefined()

    const iteratorSpy = jest.spyOn(Set.prototype, Symbol.iterator)
    flushAllScheduledMmkvWrites()

    expect(iteratorSpy).toHaveBeenCalledTimes(1)
    expect(iteratorSpy.mock.instances[0]).toHaveProperty('size', 0)
  })

  it('immediate save discards the older deferred write and its callback', () => {
    const key = 'test-immediate-save-removes-registration'
    const deleteSpy = jest.spyOn(Set.prototype, 'delete')
    const {atom: testAtom, setAndSaveImmediatelyAtom} =
      atomWithParsedMmkvStorageWithImmediateSaveOption(
        key,
        defaultValue,
        TestValueSchema
      )
    const store = createStore()
    const setSpy = jest.spyOn(storage._storage, 'set')

    store.set(testAtom, {name: 'deferred', count: 1})
    store.set(setAndSaveImmediatelyAtom, {name: 'immediate', count: 2})

    expect(deleteSpy).toHaveBeenCalledWith(testAtom.flushNow)
    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'immediate',
      count: 2,
    })

    flushAllScheduledMmkvWrites()
    flushIdleCallbacks()
    expect(setSpy).toHaveBeenCalledTimes(1)
  })

  it('blocks immediate saves for the full storage-clear lifetime', () => {
    const key = 'test-immediate-save-during-clear'
    const {setAndSaveImmediatelyAtom} =
      atomWithParsedMmkvStorageWithImmediateSaveOption(
        key,
        defaultValue,
        TestValueSchema
      )
    const store = createStore()
    const finishStorageClear = beginMmkvStorageClear()

    store.set(setAndSaveImmediatelyAtom, {name: 'sensitive', count: 1})
    expect(storage._storage.getString(key)).toBeUndefined()

    finishStorageClear()
    store.set(setAndSaveImmediatelyAtom, {name: 'after-clear', count: 2})
    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'after-clear',
      count: 2,
    })
  })

  it('flushAllScheduledMmkvWrites persists a pending value without waiting for the idle callback', () => {
    const key = 'test-flush-all-pending'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    store.set(testAtom, {name: 'pending', count: 5})
    expect(storage._storage.getString(key)).toBeUndefined()

    flushAllScheduledMmkvWrites()

    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'pending',
      count: 5,
    })
  })

  it('flushAllScheduledMmkvWrites does not persist a write invalidated by a storage clear', () => {
    const key = 'test-flush-all-after-clear'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    store.set(testAtom, {name: 'sensitive', count: 42})
    expect(storage._storage.getString(key)).toBeUndefined()

    storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())
    invalidateScheduledMmkvWrites()
    storage._storage.clearAll()

    flushAllScheduledMmkvWrites()

    expect(storage._storage.getString(key)).toBeUndefined()
    expect(store.get(testAtom)).toEqual(defaultValue)
    unsub()
  })

  it('flushNow does not write a value that was invalidated by a storage clear', () => {
    const key = 'test-flush-now-after-clear'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    // a sensitive value is written but its flush has not run yet
    store.set(testAtom, {name: 'sensitive', count: 42})

    // logout / wipe happens before the flush
    storage._storage.set(CLEAR_STORAGE_KEY, Date.now().toString())
    invalidateScheduledMmkvWrites()
    storage._storage.clearAll()

    // forcing a synchronous flush must NOT resurrect the cleared value
    testAtom.flushNow()

    expect(storage._storage.getString(key)).toBeUndefined()
    expect(store.get(testAtom)).toEqual(defaultValue)
    unsub()
  })

  it('does not re-decode on mount when the stored value has not changed', () => {
    const key = 'test-mount-no-redecode'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    const initialValue = store.get(testAtom)
    const unsub = store.sub(testAtom, () => {})

    // identity preserved — mount skipped the redundant decode + setAtom
    expect(store.get(testAtom)).toBe(initialValue)
    unsub()
  })

  it('re-reads on mount when the stored value changed before mounting', () => {
    const key = 'test-mount-redecode'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    // no listener yet — atom was created but never mounted
    storage._storage.set(key, JSON.stringify({name: 'changed', count: 2}))

    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    expect(store.get(testAtom)).toEqual({name: 'changed', count: 2})
    unsub()
  })
})

describe('own-write detection with asynchronously dispatched change listeners', () => {
  // react-native-mmkv v4 (Nitro) delivers value-changed notifications
  // asynchronously (void-returning JS callbacks are bridged as async), so an
  // own write can no longer be recognized while storage.set is still on the
  // stack. Own writes must still be skipped - otherwise every persisted write
  // triggers a re-decode that replaces all object identities in the value.
  function deferListenerNotifications(): {
    deliverPendingNotifications: () => void
  } {
    const pendingNotifications: Array<() => void> = []
    const realAddListener = storage._storage.addOnValueChangedListener.bind(
      storage._storage
    )
    jest
      .spyOn(storage._storage, 'addOnValueChangedListener')
      .mockImplementation((listener) =>
        realAddListener((changedKey: string) => {
          pendingNotifications.push(() => {
            listener(changedKey)
          })
        })
      )

    return {
      deliverPendingNotifications: () => {
        pendingNotifications.splice(0).forEach((deliver) => {
          deliver()
        })
      },
    }
  }

  it('does not re-decode the stored value after its own write', () => {
    const key = 'test-async-own-write'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    const {deliverPendingNotifications} = deferListenerNotifications()
    const unsub = store.sub(testAtom, () => {})

    const written: TestValue = {name: 'written', count: 1}
    store.set(testAtom, written)
    flushIdleCallbacks()
    expect(storage._storage.getString(key)).toBeDefined()

    const valueBeforeNotification = store.get(testAtom)
    deliverPendingNotifications()
    flushIdleCallbacks()

    // identity preserved - the change notification for our own write must
    // not schedule a re-decode
    expect(store.get(testAtom)).toBe(valueBeforeNotification)
    unsub()
  })

  it('still re-decodes on a genuinely foreign write', () => {
    const key = 'test-async-foreign-write'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema
    )
    const store = createStore()

    const {deliverPendingNotifications} = deferListenerNotifications()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.set(key, JSON.stringify({name: 'foreign', count: 7}))
    deliverPendingNotifications()
    flushIdleCallbacks()

    expect(store.get(testAtom)).toEqual({name: 'foreign', count: 7})
    unsub()
  })
})
