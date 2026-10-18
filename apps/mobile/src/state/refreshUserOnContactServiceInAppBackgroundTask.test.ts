import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {LoggedInOnAnotherDeviceError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'
import {registerInAppLoadingTask} from '../utils/inAppLoadingTasks'
import {executeTasksWithDependencies} from '../utils/inAppLoadingTasks/atoms'
import {
  afterRefreshUserUnlessAccountMoved,
  refreshUserOnContactServiceInAppBackgroundTaskId,
} from './refreshUserOnContactServiceInAppBackgroundTask'

const mockRefreshUser = jest.fn()
const mockClearDevice = jest.fn()

jest.mock('../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    apiAtom: atom({contact: {refreshUser: () => mockRefreshUser()}}),
  }
})
jest.mock('./session', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    sessionDataOrDummyAtom: atom({sessionNotificationToken: 'vexl_nt_test'}),
    sessionNotificationTokenAtom: atom(undefined),
  }
})
jest.mock('./resetLocalDataActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    clearDeviceAfterLoginOnAnotherDeviceActionAtom: atom(null, () => {
      mockClearDevice()
    }),
  }
})
jest.mock('./useLogout', () => {
  const {atom} = jest.requireActual('jotai')
  return {logoutActionAtom: atom(null, () => undefined)}
})
jest.mock('./notifications/vexlNotificationTokenAtom', () => ({
  forgetVexlSecretLocally: jest.fn(),
}))
jest.mock('./notifications/actions/generateVexlTokenActionAtom', () => ({}))
jest.mock('../utils/reportError', () => {
  const {Effect} = jest.requireActual('effect')
  return {__esModule: true, default: jest.fn(), reportErrorE: () => Effect.void}
})
jest.mock('./ActionBenchmarks', () => ({startBenchmark: () => () => {}}))
jest.mock('../utils/preferences', () => ({
  preferencesAtom: jest.requireActual('jotai').atom({runTasksInParallel: true}),
}))

const pullMessages = jest.fn()
const pullMessagesTaskId = registerInAppLoadingTask({
  name: 'pullMessagesTest',
  requirements: {requiresUserLoggedIn: true, runOn: 'resume'},
  dependsOn: [afterRefreshUserUnlessAccountMoved],
  task: () => Effect.sync(pullMessages),
})

async function resume(): Promise<void> {
  await Effect.runPromise(
    executeTasksWithDependencies([
      pullMessagesTaskId,
      refreshUserOnContactServiceInAppBackgroundTaskId,
    ])
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('keeps a device whose account moved away from pulling messages', async () => {
  mockRefreshUser.mockReturnValue(
    Effect.fail(new LoggedInOnAnotherDeviceError())
  )

  await resume()

  expect(mockClearDevice).toHaveBeenCalled()
  expect(pullMessages).not.toHaveBeenCalled()
})

it('pulls messages after a successful refresh', async () => {
  mockRefreshUser.mockReturnValue(Effect.void)

  await resume()

  expect(pullMessages).toHaveBeenCalled()
})

it('still pulls messages when the contact service fails', async () => {
  mockRefreshUser.mockReturnValue(Effect.fail(new UnexpectedServerError({})))

  await resume()

  expect(pullMessages).toHaveBeenCalled()
})
