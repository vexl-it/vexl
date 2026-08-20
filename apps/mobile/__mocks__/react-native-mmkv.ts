type StoredValue = ArrayBuffer | boolean | number | string

class MMKV {
  private readonly data = new Map<string, StoredValue>()
  private readonly listeners = new Set<(key: string) => void>()

  set(key: string, value: StoredValue): void {
    this.data.set(key, value)
    this.emitChange(key)
  }

  getString(key: string): string | undefined {
    const value = this.data.get(key)
    return typeof value === 'string' ? value : undefined
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.data.get(key)
    return typeof value === 'boolean' ? value : undefined
  }

  remove(key: string): void {
    this.data.delete(key)
    this.emitChange(key)
  }

  clearAll(): void {
    this.data.clear()
  }

  getAllKeys(): string[] {
    return Array.from(this.data.keys())
  }

  addOnValueChangedListener(listener: (key: string) => void): {
    remove: () => void
  } {
    this.listeners.add(listener)
    return {remove: () => this.listeners.delete(listener)}
  }

  private emitChange(key: string): void {
    for (const listener of this.listeners) listener(key)
  }
}

export const createMMKV = (): MMKV => new MMKV()
