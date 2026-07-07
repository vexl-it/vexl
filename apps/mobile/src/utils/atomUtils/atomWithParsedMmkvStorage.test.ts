import {Schema} from 'effect'
import {createStore} from 'jotai'
import {InteractionManager} from 'react-native'
import {storage} from '../mmkv/effectMmkv'
import {
  CLEAR_STORAGE_KEY,
  atomWithParsedMmkvStorage,
} from './atomWithParsedMmkvStorage'

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

let interactionQueue: Array<() => void> = []

function flushInteractions(): void {
  while (interactionQueue.length > 0) {
    const callback = interactionQueue.shift()
    if (callback) callback()
  }
}

beforeEach(() => {
  interactionQueue = []
  jest
    .spyOn(InteractionManager, 'runAfterInteractions')
    .mockImplementation((task) => {
      if (typeof task === 'function') {
        interactionQueue.push(() => {
          void task()
        })
      }
      return Object.assign(Promise.resolve(), {
        done: () => {},
        cancel: () => {},
      })
    })
})

afterEach(() => {
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

  it('persists writes after interactions and coalesces queued writes to the newest value', () => {
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

    flushInteractions()

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
    flushInteractions()

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
      TestValueSchema
    )
    const store = createStore()
    const unsub = store.sub(testAtom, () => {})

    const written: TestValue = {name: 'own', count: 5}
    store.set(testAtom, written)
    flushInteractions()

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
    flushInteractions()

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
    flushInteractions()

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

    storage._storage.delete(key)
    flushInteractions()

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
