import '@testing-library/jest-native/extend-expect'

// React Native provides requestIdleCallback at runtime, but the jest
// environment does not. Without this polyfill any code deferring work to an
// idle callback (e.g. MMKV atom write flushes) throws a ReferenceError.
if (typeof globalThis.requestIdleCallback === 'undefined') {
  globalThis.requestIdleCallback = (callback: IdleRequestCallback): number =>
    Number(
      setTimeout(() => {
        callback({didTimeout: false, timeRemaining: () => 50})
      }, 0)
    )
  globalThis.cancelIdleCallback = (handle: number): void => {
    clearTimeout(handle)
  }
}

jest.mock('./src/utils/localization/I18nProvider', () => ({
  useTranslation: () => ({t: (key: any) => key}),
}))

jest.mock('expo-testflight', () => ({
  isTestFlight: jest.fn(() => false),
}))
