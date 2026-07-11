import * as Sentry from '@sentry/react-native'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import reportError from './reportError'

let mockControlMode = 'normal'

jest.mock('./deviceMigration/controlStore', () => ({
  readMigrationControlRecord: () => ({mode: mockControlMode}),
}))

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}))

jest.mock('./removeSensitiveData', () => ({
  toErrorJsonWithRemovedSensitiveData: (error: Error) => ({
    message: error.message,
  }),
  toErrorWithRemovedSensitiveData: (error: Error) => error,
  toExtraWithRemovedSensitiveData: (extra: Record<string, unknown>) => extra,
}))

jest.mock(
  '@vexl-next/resources-utils/src/reportErrorFromResourcesUtils',
  () => ({
    initReportError: jest.fn(),
  })
)

const captureExceptionMock = jest.mocked(Sentry.captureException)

describe('reportError migration telemetry silence', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    // reportError only captures to Sentry outside dev mode.
    Reflect.set(globalThis, '__DEV__', false)
  })

  afterAll(() => {
    Reflect.set(globalThis, '__DEV__', true)
  })

  beforeEach(() => {
    mockControlMode = 'normal'
    captureExceptionMock.mockClear()
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('captures to Sentry in normal mode (behavior unchanged)', () => {
    reportError('error', new Error('ordinary failure'), {some: 'extra'})

    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it.each([
    'sourceQuiescing',
    'sourceErasedAwaitingDestinationAck',
    'destinationStaged',
    'recoveryRequired',
  ])('never captures to Sentry in %s mode', (mode) => {
    mockControlMode = mode

    reportError('error', new Error('should stay local'), {
      payload: 'must never leave the device',
    })

    expect(captureExceptionMock).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('logs only the enumerated code for migration-tagged errors while migrating', () => {
    mockControlMode = 'sourceServing'

    reportError('error', new DeviceMigrationError({code: 'cancelled'}))

    expect(captureExceptionMock).not.toHaveBeenCalled()
    // getConsoleLvl binds console as the first argument; the suppression
    // message and the enumerated code follow.
    const lastCall =
      consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1]
    expect(lastCall).toBeDefined()
    expect(lastCall).toContain('cancelled')
    expect(
      lastCall.some(
        (arg: unknown) => typeof arg === 'string' && arg.includes('suppressed')
      )
    ).toBe(true)
  })
})
