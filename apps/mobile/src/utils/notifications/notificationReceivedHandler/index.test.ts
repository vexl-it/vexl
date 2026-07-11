import * as TaskManager from 'expo-task-manager'
import {loadSession} from '../../../state/session/loadSession'
import {reportErrorE} from '../../reportError'
import {extractDataFromNotification} from './extractDataFromNotification'
// Importing the module under test registers the TaskManager task at module
// scope; the mocked defineTask (all jest.mock calls are hoisted above every
// import) captures the handler.
import './index'

let mockControlMode = 'normal'

jest.mock('../../deviceMigration/controlStore', () => ({
  readMigrationControlRecord: () => ({mode: mockControlMode}),
}))

jest.mock('expo-notifications', () => ({
  BackgroundNotificationTaskResult: {NoData: 1, NewData: 2, Failed: 3},
  registerTaskAsync: jest.fn(async () => undefined),
}))

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}))

jest.mock('../../../state/session/loadSession', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    loadSession: jest.fn(() => Effect.succeed({sessionLoaded: true})),
  }
})

jest.mock('../../reportError', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    __esModule: true,
    default: jest.fn(),
    reportErrorE: jest.fn(() => Effect.succeed(undefined)),
  }
})

jest.mock('./extractDataFromNotification', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    extractDataFromNotification: jest.fn(() =>
      Effect.succeed({_tag: 'DebugDummyNotificationData'})
    ),
  }
})

jest.mock('./handlers/admitedToClubNetwork', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    handleAdmitedToClubNetworkNotification: jest.fn(() => Effect.void),
  }
})
jest.mock('./handlers/clubDeactivated', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {handleClubDeactivatedNotification: jest.fn(() => Effect.void)}
})
jest.mock('./handlers/debugDummy', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {handleDebugDummyNotification: jest.fn(() => Effect.void)}
})
jest.mock('./handlers/newChatMessageNotice', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {handleNewChatMessageNoticeNotification: jest.fn(() => Effect.void)}
})
jest.mock('./handlers/newClubConnection', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {handleNewClubConnectionNotification: jest.fn(() => Effect.void)}
})
jest.mock('./handlers/newSocialNetworkConnection', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    handleNewSocialNetworkConnectionNotification: jest.fn(() => Effect.void),
  }
})
jest.mock('./handlers/userInactivity', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {handleUserInactivityNotification: jest.fn(() => Effect.void)}
})
jest.mock('./handlers/userLoginOnDifferentDevice', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {
    handleUserLoginOnDifferentDeviceNotification: jest.fn(() => Effect.void),
  }
})
jest.mock('./handlers/vexlProductNotification', () => {
  const {Effect} = jest.requireActual('effect/index')
  return {handleVexlProductNotification: jest.fn(() => Effect.void)}
})

const extractDataFromNotificationMock = jest.mocked(extractDataFromNotification)
const loadSessionMock = jest.mocked(loadSession)
const reportErrorEMock = jest.mocked(reportErrorE)

const getRegisteredTaskExecutor = (): TaskManager.TaskManagerTaskExecutor => {
  const firstCall = jest.mocked(TaskManager.defineTask).mock.calls[0]
  if (firstCall === undefined)
    throw new Error('Notification background task was not registered')
  expect(firstCall[0]).toBe('notification-background-task-v2')
  return firstCall[1]
}

const runTaskWithDummyPayload = async (): Promise<unknown> => {
  const executor = getRegisteredTaskExecutor()
  return await executor({
    data: {notification: {some: 'payload'}},
    error: null,
    executionInfo: {
      eventId: 'test-event',
      taskName: 'notification-background-task-v2',
    },
  })
}

describe('notification background task migration gate', () => {
  beforeEach(() => {
    mockControlMode = 'normal'
    extractDataFromNotificationMock.mockClear()
    loadSessionMock.mockClear()
    reportErrorEMock.mockClear()
  })

  it.each([
    'sourceQuiescing',
    'sourceRetirementCommitted',
    'destinationReceiving',
    'destinationAwaitingSourceOutcome',
    'recoveryRequired',
  ])(
    'returns NoData in %s mode before extracting or reporting anything',
    async (mode) => {
      mockControlMode = mode

      const result = await runTaskWithDummyPayload()

      expect(result).toBe(1) // BackgroundNotificationTaskResult.NoData
      expect(extractDataFromNotificationMock).not.toHaveBeenCalled()
      expect(loadSessionMock).not.toHaveBeenCalled()
      expect(reportErrorEMock).not.toHaveBeenCalled()
    }
  )

  it('processes notifications normally in normal mode', async () => {
    const result = await runTaskWithDummyPayload()

    expect(result).toBe(1) // NoData is the ordinary success result
    expect(extractDataFromNotificationMock).toHaveBeenCalledTimes(1)
    expect(reportErrorEMock).not.toHaveBeenCalled()
  })
})
