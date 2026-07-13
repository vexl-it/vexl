import {loadSession} from '../../state/session/loadSession'
import {migrateBackgroundTaskIntervalIfNeeded} from './index'
import {processBackgroundTask} from './processBackgroundTask'

let mockControlMode = 'normal'

jest.mock('../deviceMigration/controlStore', () => ({
  readMigrationControlRecord: () => ({mode: mockControlMode}),
}))

jest.mock('expo-background-task', () => ({
  BackgroundTaskResult: {Success: 1, Failed: 2},
}))

jest.mock('../../state/session/loadSession', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    loadSession: jest.fn(() =>
      Effect.succeed({sessionLoaded: false, blockingRecoveryRequired: false})
    ),
  }
})

jest.mock('../../state/chat/atoms/fetchNewMessagesActionAtom', () => ({
  __esModule: true,
  default: 'unused-in-this-test',
}))

jest.mock('../newOffersNotificationBackgroundTask', () => ({
  newOffersNotificationBackgroundTask: jest.fn(async () => undefined),
}))

jest.mock('./index', () => ({
  migrateBackgroundTaskIntervalIfNeeded: jest.fn(async () => undefined),
}))

const loadSessionMock = jest.mocked(loadSession)
const migrateIntervalMock = jest.mocked(migrateBackgroundTaskIntervalIfNeeded)

describe('processBackgroundTask migration gate', () => {
  beforeEach(() => {
    mockControlMode = 'normal'
    jest.clearAllMocks()
  })

  it.each([
    'sourceQuiescing',
    'sourceRetirementCommitted',
    'sourceErasing',
    'destinationReceiving',
    'destinationInstalling',
    'recoveryRequired',
  ])(
    'returns Success in %s mode without touching session, storage or network',
    async (mode) => {
      mockControlMode = mode

      const result = await processBackgroundTask()

      expect(result).toBe(1) // BackgroundTaskResult.Success
      expect(loadSessionMock).not.toHaveBeenCalled()
      expect(migrateIntervalMock).not.toHaveBeenCalled()
    }
  )

  it('runs the ordinary background work in normal mode', async () => {
    const result = await processBackgroundTask()

    expect(result).toBe(1) // Success (session not loaded short-circuits)
    expect(loadSessionMock).toHaveBeenCalledTimes(1)
    expect(migrateIntervalMock).toHaveBeenCalledTimes(1)
  })
})
