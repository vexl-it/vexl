import {Array} from 'effect'
import {type MMKV} from 'react-native-mmkv'

/**
 * The subset of the native MMKV API the app relies on. Narrower than `MMKV`
 * so a non-native store can stand in before the user's encrypted store is
 * bound (see `sessionBoundMmkvStore.ts`).
 */
export type MmkvStore = Pick<
  MMKV,
  | 'set'
  | 'getString'
  | 'getBoolean'
  | 'contains'
  | 'remove'
  | 'getAllKeys'
  | 'clearAll'
  | 'addOnValueChangedListener'
  | 'length'
  | 'isEncrypted'
>

type MmkvStoredValue = boolean | string

/** Strings and booleans are the only value types the app stores. */
export function copyMmkvEntries(
  from: MmkvStore,
  to: MmkvStore,
  keys: readonly string[]
): void {
  for (const key of keys) {
    const value = from.getString(key) ?? from.getBoolean(key)
    if (value !== undefined) to.set(key, value)
  }
}

export class InMemoryMmkvStore implements MmkvStore {
  private readonly values = new Map<string, MmkvStoredValue>()
  private readonly listeners = new Set<(key: string) => void>()

  constructor(readonly isEncrypted: boolean = false) {}

  get length(): number {
    return this.values.size
  }

  set(key: string, value: MmkvStoredValue): void {
    this.values.set(key, value)
    this.notify(key)
  }

  getString(key: string): string | undefined {
    const value = this.values.get(key)
    return typeof value === 'string' ? value : undefined
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.values.get(key)
    return typeof value === 'boolean' ? value : undefined
  }

  contains(key: string): boolean {
    return this.values.has(key)
  }

  remove(key: string): boolean {
    const removed = this.values.delete(key)
    if (removed) this.notify(key)
    return removed
  }

  getAllKeys(): string[] {
    return Array.fromIterable(this.values.keys())
  }

  clearAll(): void {
    this.values.clear()
  }

  addOnValueChangedListener(listener: (key: string) => void): {
    remove: () => void
  } {
    this.listeners.add(listener)
    return {
      remove: () => {
        this.listeners.delete(listener)
      },
    }
  }

  private notify(key: string): void {
    for (const listener of this.listeners) listener(key)
  }
}
