import * as BackgroundTask from 'expo-background-task'
import {flushAllScheduledMmkvWrites} from '../atomUtils/atomWithParsedMmkvStorage'
import {migrateBackgroundTaskIntervalIfNeeded} from './index'
import {processBackgroundTask} from './processBackgroundTask'

jest.mock('expo-background-task', () => ({
  BackgroundTaskResult: {
    Success: 'success',
    Failed: 'failed',
  },
}))

jest.mock('../../state/session/loadSession', () => {
  const {Effect} = jest.requireActual('effect')

  return {
    loadSession: jest.fn(() => Effect.succeed({sessionLoaded: false})),
  }
})

jest.mock('../../state/chat/atoms/fetchNewMessagesActionAtom', () => ({
  __esModule: true,
  default: Symbol('fetchMessagesForAllInboxesAtom'),
}))

jest.mock('../atomUtils/atomWithParsedMmkvStorage', () => ({
  flushAllScheduledMmkvWrites: jest.fn(),
}))

jest.mock('../newOffersNotificationBackgroundTask', () => ({
  newOffersNotificationBackgroundTask: jest.fn(),
}))

jest.mock('./index', () => ({
  migrateBackgroundTaskIntervalIfNeeded: jest.fn(),
}))

const flushAllScheduledMmkvWritesMock = jest.mocked(flushAllScheduledMmkvWrites)
const migrateBackgroundTaskIntervalIfNeededMock = jest.mocked(
  migrateBackgroundTaskIntervalIfNeeded
)

describe('processBackgroundTask', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    migrateBackgroundTaskIntervalIfNeededMock.mockResolvedValue(undefined)
  })

  it('flushes scheduled MMKV writes before returning', async () => {
    await expect(processBackgroundTask()).resolves.toBe(
      BackgroundTask.BackgroundTaskResult.Success
    )

    expect(flushAllScheduledMmkvWritesMock).toHaveBeenCalledTimes(1)
  })

  it('flushes scheduled MMKV writes when final task work rejects', async () => {
    const error = new Error('Migration failed')
    migrateBackgroundTaskIntervalIfNeededMock.mockRejectedValue(error)

    await expect(processBackgroundTask()).rejects.toBe(error)
    expect(flushAllScheduledMmkvWritesMock).toHaveBeenCalledTimes(1)
  })
})
