import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  InvalidLoginSessionProofError,
  LoggedInOnAnotherDeviceError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'
import {getDefaultStore} from 'jotai'
import {registerInAppLoadingTask} from '../utils/inAppLoadingTasks'
import {executeTasksWithDependencies} from '../utils/inAppLoadingTasks/atoms'
import {ensureSessionNotificationTokenExistsTaskId} from './notifications/ensureSessionNotificationTokenExistsTask'
import {
  afterRefreshUserUnlessAccountMoved,
  refreshUserOnContactService,
  refreshUserOnContactServiceInAppBackgroundTaskId,
  unlessAccountMoved,
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
    sessionDataOrDummyAtom: atom({
      sessionNotificationToken: 'vexl_nt_test',
      loginSessionId: '0f9b2597-217d-4f8d-9de6-ef7239662359',
      privateKey: jest
        .requireActual('@vexl-next/cryptography/src/KeyHolder')
        .generatePrivateKey(),
    }),
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
jest.mock('./notifications/ensureSessionNotificationTokenExistsTask', () => ({
  ensureSessionNotificationTokenExistsTaskId: jest
    .requireActual('../utils/inAppLoadingTasks')
    .registerInAppLoadingTask({
      name: 'ensureSessionNotificationTokenExists',
      requirements: {requiresUserLoggedIn: true, runOn: 'resume'},
      task: () => jest.requireActual('effect').Effect.void,
    }),
}))
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
      ensureSessionNotificationTokenExistsTaskId,
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

it('keeps the device when contact-service rejects its login session proof', async () => {
  mockRefreshUser.mockReturnValue(
    Effect.fail(new InvalidLoginSessionProofError())
  )

  await resume()

  expect(mockClearDevice).not.toHaveBeenCalled()
  expect(pullMessages).toHaveBeenCalled()
})

it('still pulls messages when the contact service fails', async () => {
  mockRefreshUser.mockReturnValue(Effect.fail(new UnexpectedServerError({})))

  await resume()

  expect(pullMessages).toHaveBeenCalled()
})

it('keeps notification pulls from running until the account check says it stayed', async () => {
  const store = getDefaultStore()
  const pullOnNotification = (): Promise<unknown> =>
    Effect.runPromise(unlessAccountMoved(store.get, Effect.sync(pullMessages)))

  mockRefreshUser.mockReturnValue(Effect.void)
  await Effect.runPromise(refreshUserOnContactService(store))
  await pullOnNotification()
  expect(pullMessages).toHaveBeenCalledTimes(1)

  mockRefreshUser.mockReturnValue(
    Effect.fail(new LoggedInOnAnotherDeviceError()).pipe(
      Effect.delay('10 millis')
    )
  )
  const movedCheck = Effect.runPromise(
    Effect.either(refreshUserOnContactService(store))
  )
  await pullOnNotification()
  await movedCheck

  expect(pullMessages).toHaveBeenCalledTimes(1)
})
