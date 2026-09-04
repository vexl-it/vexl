export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 2
export const WHEN_UNLOCKED = 1

export interface SecureStoreOptions {
  keychainAccessible?: number
  keychainService?: string
}

const items = new Map<string, string>()

export const getItem = jest.fn(
  (key: string, _options?: SecureStoreOptions): string | null =>
    items.get(key) ?? null
)

export const setItem = jest.fn(
  (key: string, value: string, _options?: SecureStoreOptions): void => {
    items.set(key, value)
  }
)

export const getItemAsync = jest.fn(
  async (key: string, _options?: SecureStoreOptions): Promise<string | null> =>
    items.get(key) ?? null
)

export const setItemAsync = jest.fn(
  async (
    key: string,
    value: string,
    _options?: SecureStoreOptions
  ): Promise<void> => {
    items.set(key, value)
  }
)

export const deleteItemAsync = jest.fn(
  async (key: string, _options?: SecureStoreOptions): Promise<void> => {
    items.delete(key)
  }
)

/** Test helper: forget every stored item. */
export const resetMockSecureStore = (): void => {
  items.clear()
}
