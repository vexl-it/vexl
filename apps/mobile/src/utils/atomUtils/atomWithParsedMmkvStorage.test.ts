import {Schema} from 'effect'
import {createStore} from 'jotai'
import {storage} from '../mmkv/effectMmkv'
import {
  CLEAR_STORAGE_KEY,
  atomWithParsedMmkvStorage,
  atomWithParsedMmkvStorageWithImmediateSaveOption,
  invalidateScheduledMmkvWrites,
} from './atomWithParsedMmkvStorage'
import {
  flushAllPendingMmkvWrites,
  freezeMmkvPersistence,
  isMmkvPersistenceFrozen,
  unfreezeMmkvPersistence,
} from './mmkvMigrationRegistry'

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
  // Never leak the migration write-freeze into other tests.
  unfreezeMmkvPersistence()
  jest.restoreAllMocks()
})

describe('atomWithParsedMmkvStorage', () => {
  it('initializes from the value stored in mmkv', () => {
    const key = 'test-init-from-storage'
    storage._storage.set(key, JSON.stringify({name: 'stored', count: 1}))

    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual({name: 'stored', count: 1})
  })

  it('initializes with the default value when nothing is stored', () => {
    const key = 'test-init-default'

    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual(defaultValue)
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
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    expect(store.get(testAtom)).toEqual({name: 'legacy', count: 2})
  })

  it('persists writes after an idle callback and coalesces queued writes to the newest value', () => {
    const key = 'test-coalesce-writes'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    store.set(testAtom, {name: 'clean', count: 1})
    flushIdleCallbacks()

    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'clean',
      count: 1,
    })
  })

  it('does not feed its own write back through the change listener', () => {
    const key = 'test-own-write-ignored'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
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
    const atomA = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const atomB = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
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
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    storage._storage.delete(key)
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
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
    )
    createStore()

    const setSpy = jest.spyOn(storage._storage, 'set')

    testAtom.flushNow()

    expect(setSpy).not.toHaveBeenCalled()
    expect(storage._storage.getString(key)).toBeUndefined()
  })

  it('flushNow does not write a value that was invalidated by a storage clear', () => {
    const key = 'test-flush-now-after-clear'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
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
      TestValueSchema,
      'ephemeral'
    )
    // no listener yet — atom was created but never mounted
    storage._storage.set(key, JSON.stringify({name: 'changed', count: 2}))

    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    expect(store.get(testAtom)).toEqual({name: 'changed', count: 2})
    unsub()
  })
})

describe('mmkv persistence freeze', () => {
  it('keeps updating in-memory state while frozen but never writes to storage', () => {
    const key = 'test-freeze-deferred-write'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    freezeMmkvPersistence()
    expect(isMmkvPersistenceFrozen()).toBe(true)

    store.set(testAtom, {name: 'frozen', count: 1})

    // in-memory state updated, storage untouched — even after the deferred
    // flush would have run
    expect(store.get(testAtom)).toEqual({name: 'frozen', count: 1})
    flushIdleCallbacks()
    expect(storage._storage.getString(key)).toBeUndefined()
  })

  it('flushNow does not write to storage while frozen', () => {
    const key = 'test-freeze-flush-now'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    // queue a deferred write, then freeze before it lands
    store.set(testAtom, {name: 'pending', count: 1})
    freezeMmkvPersistence()

    testAtom.flushNow()

    expect(storage._storage.getString(key)).toBeUndefined()
  })

  it('setAndSaveImmediatelyAtom does not write to storage while frozen', () => {
    const key = 'test-freeze-immediate-save'
    const {atom: testAtom, setAndSaveImmediatelyAtom} =
      atomWithParsedMmkvStorageWithImmediateSaveOption(
        key,
        defaultValue,
        TestValueSchema,
        'ephemeral'
      )
    const store = createStore()

    freezeMmkvPersistence()
    store.set(setAndSaveImmediatelyAtom, {name: 'frozen', count: 2})

    expect(store.get(testAtom)).toEqual({name: 'frozen', count: 2})
    expect(storage._storage.getString(key)).toBeUndefined()
  })

  it('persists sets made after unfreezing again', () => {
    const key = 'test-freeze-unfreeze'
    const testAtom = atomWithParsedMmkvStorage(
      key,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    freezeMmkvPersistence()
    store.set(testAtom, {name: 'dropped', count: 1})
    flushIdleCallbacks()
    expect(storage._storage.getString(key)).toBeUndefined()

    unfreezeMmkvPersistence()
    expect(isMmkvPersistenceFrozen()).toBe(false)

    store.set(testAtom, {name: 'persisted', count: 2})
    flushIdleCallbacks()

    expect(JSON.parse(storage._storage.getString(key) ?? '')).toEqual({
      name: 'persisted',
      count: 2,
    })
  })
})

describe('flushAllPendingMmkvWrites', () => {
  it('synchronously persists every pending deferred write', () => {
    const keyA = 'test-flush-all-a'
    const keyB = 'test-flush-all-b'
    const atomA = atomWithParsedMmkvStorage(
      keyA,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const atomB = atomWithParsedMmkvStorage(
      keyB,
      defaultValue,
      TestValueSchema,
      'ephemeral'
    )
    const store = createStore()

    store.set(atomA, {name: 'a', count: 1})
    store.set(atomB, {name: 'b', count: 2})

    // nothing persisted yet — the deferred flushes have not run
    expect(storage._storage.getString(keyA)).toBeUndefined()
    expect(storage._storage.getString(keyB)).toBeUndefined()

    flushAllPendingMmkvWrites()

    expect(JSON.parse(storage._storage.getString(keyA) ?? '')).toEqual({
      name: 'a',
      count: 1,
    })
    expect(JSON.parse(storage._storage.getString(keyB) ?? '')).toEqual({
      name: 'b',
      count: 2,
    })

    // the already-scheduled deferred flushes are now no-ops
    const setSpy = jest.spyOn(storage._storage, 'set')
    flushIdleCallbacks()
    expect(setSpy).not.toHaveBeenCalled()
  })
})
