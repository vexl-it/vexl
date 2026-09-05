import {InMemoryMmkvStore} from '../src/utils/mmkv/inMemoryMmkvStore'

interface Configuration {
  id?: string
  encryptionKey?: string
  encryptionType?: 'AES-128' | 'AES-256'
  recoveryStrategy?: 'discard-on-error' | 'recover-on-error'
  compareBeforeSet?: boolean
}

const DEFAULT_ID = 'mmkv.default'

// Simulates the on-disk files: one entry per instance id, remembering which
// key it was written with, and surviving across `createMMKV` calls the way
// files survive across app launches.
const files = new Map<
  string,
  {encryptionKey: string | undefined; store: MMKV}
>()

class MMKV extends InMemoryMmkvStore {
  constructor(
    readonly id: string,
    encryptionKey: string | undefined
  ) {
    super(encryptionKey !== undefined)
  }
}

/** The unwrapped implementation, for tests that override `createMMKV` once. */
export const createMockMMKV = (configuration?: Configuration): MMKV => {
  const id = configuration?.id ?? DEFAULT_ID
  const encryptionKey = configuration?.encryptionKey
  const existing = files.get(id)
  if (existing !== undefined && existing.encryptionKey === encryptionKey)
    return existing.store

  // A new file, or an existing file opened with the wrong key: real MMKV
  // cannot decode the latter and, with recover-on-error, starts over empty.
  const store = new MMKV(id, encryptionKey)
  files.set(id, {encryptionKey, store})
  return store
}

export const createMMKV = jest.fn(createMockMMKV)

export const existsMMKV = jest.fn((id: string): boolean => files.has(id))

export const deleteMMKV = jest.fn((id: string): boolean => files.delete(id))

/** Test helper: forget every simulated file. */
export const resetMockMmkvFiles = (): void => {
  files.clear()
}
