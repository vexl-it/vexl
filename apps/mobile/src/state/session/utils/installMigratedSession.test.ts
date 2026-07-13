import AsyncStorage from '@react-native-async-storage/async-storage'
import {generateRandomBase64Url} from '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes'
import type * as CryptoHelpers from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {aesCTREncrypt} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect} from 'effect'
import * as SecretStore from 'expo-secure-store'
import {installMigratedSessionToStorage} from './installMigratedSession'

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 2,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock(
  '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes',
  () => ({generateRandomBase64Url: jest.fn()})
)

jest.mock('@vexl-next/generic-utils/src/effect-helpers/crypto', () => ({
  ...jest.requireActual<typeof CryptoHelpers>(
    '@vexl-next/generic-utils/src/effect-helpers/crypto'
  ),
  aesCTREncrypt: jest.fn(),
}))

jest.mock('react-native-mmkv', () => {
  class MMKV {
    private readonly values = new Map<string, boolean | string>()
    set(key: string, value: boolean | string): void {
      this.values.set(key, value)
    }
    getBoolean(key: string): boolean | undefined {
      const value = this.values.get(key)
      return typeof value === 'boolean' ? value : undefined
    }
    delete(key: string): void {
      this.values.delete(key)
    }
  }
  return {MMKV}
})

describe('installMigratedSessionToStorage', () => {
  it('uses a fresh secret and writes SecureStore before AsyncStorage', async () => {
    const randomSecret = 'fresh-random-destination-secret'
    jest.mocked(generateRandomBase64Url).mockResolvedValue(randomSecret)
    jest
      .mocked(aesCTREncrypt)
      .mockReturnValue(() => Effect.succeed('encrypted-session'))
    jest.mocked(SecretStore.setItemAsync).mockResolvedValue()
    jest.mocked(SecretStore.getItemAsync).mockResolvedValue(randomSecret)
    jest.mocked(AsyncStorage.setItem).mockResolvedValue()
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('encrypted-session')

    await Effect.runPromise(
      installMigratedSessionToStorage({sessionJson: '{"version":2}'})
    )

    expect(generateRandomBase64Url).toHaveBeenCalledWith(32)
    expect(aesCTREncrypt).toHaveBeenCalledWith(randomSecret)
    expect(SecretStore.setItemAsync).toHaveBeenCalledWith(
      'secretToken_V2',
      randomSecret,
      {keychainAccessible: 2}
    )
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'session',
      'encrypted-session'
    )
    const secureOrder = jest.mocked(SecretStore.setItemAsync).mock
      .invocationCallOrder[0]
    const asyncOrder = jest.mocked(AsyncStorage.setItem).mock
      .invocationCallOrder[0]
    expect(secureOrder).toBeDefined()
    expect(asyncOrder).toBeDefined()
    if (secureOrder !== undefined && asyncOrder !== undefined)
      expect(secureOrder).toBeLessThan(asyncOrder)
  })
})
