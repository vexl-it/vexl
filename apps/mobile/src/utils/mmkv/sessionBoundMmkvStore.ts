import {copyMmkvEntries, InMemoryMmkvStore, type MmkvStore} from './mmkvStore'

/**
 * The store all user-data atoms read through. Until a session is known it
 * delegates to a volatile in-memory store, so atoms created at import time
 * simply see defaults. `bind` switches it to the user's encrypted store and
 * notifies every listener for each stored key, which makes mounted atoms
 * re-read their values.
 */
export class SessionBoundMmkvStore implements MmkvStore {
  private target: MmkvStore = new InMemoryMmkvStore()
  private targetSubscription: {remove: () => void} | undefined
  private readonly listeners = new Set<(key: string) => void>()

  constructor() {
    this.attach(this.target)
  }

  get isEncrypted(): boolean {
    return this.target.isEncrypted
  }

  get length(): number {
    return this.target.length
  }

  bind(store: MmkvStore): void {
    // Writes made before the session was known (e.g. by the login flow)
    // belong to the user that is being bound.
    copyMmkvEntries(this.target, store, this.target.getAllKeys())
    this.attach(store)
    for (const key of store.getAllKeys()) this.notify(key)
  }

  unbind(): void {
    this.attach(new InMemoryMmkvStore())
  }

  set(key: string, value: Parameters<MmkvStore['set']>[1]): void {
    this.target.set(key, value)
  }

  getString(key: string): string | undefined {
    return this.target.getString(key)
  }

  getBoolean(key: string): boolean | undefined {
    return this.target.getBoolean(key)
  }

  contains(key: string): boolean {
    return this.target.contains(key)
  }

  remove(key: string): boolean {
    return this.target.remove(key)
  }

  getAllKeys(): string[] {
    return this.target.getAllKeys()
  }

  clearAll(): void {
    this.target.clearAll()
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

  private attach(store: MmkvStore): void {
    this.targetSubscription?.remove()
    this.target = store
    this.targetSubscription = store.addOnValueChangedListener((key) => {
      this.notify(key)
    })
  }

  private notify(key: string): void {
    for (const listener of this.listeners) listener(key)
  }
}
