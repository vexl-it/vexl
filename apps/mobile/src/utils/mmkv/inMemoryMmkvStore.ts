import {Array} from 'effect'
import {type MMKV} from 'react-native-mmkv'

/**
 * The subset of the native MMKV API the app relies on. Narrower than `MMKV`
 * so a non-native placeholder can stand in when the encrypted store cannot be
 * opened (see `encryptedMmkvStorage.ts`).
 */
export type MmkvStore = Pick<
  MMKV,
  | 'set'
  | 'getString'
  | 'getBoolean'
  | 'getNumber'
  | 'getBuffer'
  | 'contains'
  | 'remove'
  | 'getAllKeys'
  | 'clearAll'
  | 'addOnValueChangedListener'
  | 'length'
  | 'isEncrypted'
>

export type MmkvStoredValue = boolean | string | number | ArrayBuffer

/**
 * Volatile stand-in used only while the encrypted store is locked or
 * unavailable. Nothing written here reaches disk; the session load blocks the
 * app in those states so no user data is ever routed through it.
 */
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

  getNumber(key: string): number | undefined {
    const value = this.values.get(key)
    return typeof value === 'number' ? value : undefined
  }

  getBuffer(key: string): ArrayBuffer | undefined {
    const value = this.values.get(key)
    return value instanceof ArrayBuffer ? value : undefined
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
