import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  InvalidLoginSessionProofError,
  LoggedInOnAnotherDeviceError,
  UserNotFoundError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Either, Option} from 'effect'
import {getDefaultStore, type Getter, type PrimitiveAtom} from 'jotai'
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
const mockRefreshExtraNumber = jest.fn()
const mockClearDevice = jest.fn()
const mockLogout = jest.fn()
const mockDropPhoneNumbers = jest.fn()
const mockAddLostPhoneNumbersToNotice = jest.fn()

jest.mock('../api/contactApiForSession', () => {
  const {atom} = jest.requireActual('jotai')
  const withExtraNumberAtom = atom(false)
  return {
    withExtraNumberAtom,
    phoneNumberContactApisAtom: atom((get: Getter) => [
      {
        phoneNumber: '+420733733733',
        contactApi: {
          refreshUser: (request: unknown) => mockRefreshUser(request),
        },
      },
      ...(get(withExtraNumberAtom)
        ? [
            {
              phoneNumber: '+420777777777',
              contactApi: {
                refreshUser: (request: unknown) =>
                  mockRefreshExtraNumber(request),
              },
            },
          ]
        : []),
    ]),
  }
})
jest.mock('./phoneNumbers/dropPhoneNumbersFromSessionActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    dropPhoneNumbersFromSessionActionAtom: atom(
      null,
      (_get: unknown, _set: unknown, phoneNumbers: unknown) =>
        mockDropPhoneNumbers(phoneNumbers)
    ),
  }
})
jest.mock('./phoneNumbers/lostPhoneNumbersNotice', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    addLostPhoneNumbersToNoticeActionAtom: atom(
      null,
      (_get: unknown, _set: unknown, phoneNumbers: unknown) => {
        mockAddLostPhoneNumbersToNotice(phoneNumbers)
      }
    ),
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
  return {
    logoutActionAtom: atom(null, () => {
      mockLogout()
    }),
  }
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

function setWithExtraNumber(withExtraNumber: boolean): void {
  const {withExtraNumberAtom} = jest.requireMock<{
    withExtraNumberAtom: PrimitiveAtom<boolean>
  }>('../api/contactApiForSession')
  getDefaultStore().set(withExtraNumberAtom, withExtraNumber)
}

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
  setWithExtraNumber(false)
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

describe('with an extra phone number', () => {
  beforeEach(() => {
    setWithExtraNumber(true)
    mockDropPhoneNumbers.mockReturnValue(Either.right(undefined))
  })

  it('refreshes every number and sends the notification token with the main one only', async () => {
    mockRefreshUser.mockReturnValue(Effect.void)
    mockRefreshExtraNumber.mockReturnValue(Effect.void)

    await resume()

    expect(mockRefreshUser).toHaveBeenCalledWith(
      expect.objectContaining({
        vexlNotificationToken: Option.some('vexl_nt_test'),
      })
    )
    expect(mockRefreshExtraNumber).toHaveBeenCalledWith(
      expect.objectContaining({vexlNotificationToken: Option.none()})
    )
    expect(pullMessages).toHaveBeenCalled()
  })

  it('drops a number someone logged in with elsewhere and keeps the account', async () => {
    mockRefreshUser.mockReturnValue(Effect.void)
    mockRefreshExtraNumber.mockReturnValue(Effect.fail(new UserNotFoundError()))

    await resume()

    expect(mockDropPhoneNumbers).toHaveBeenCalledWith(['+420777777777'])
    expect(mockAddLostPhoneNumbersToNotice).toHaveBeenCalledWith([
      '+420777777777',
    ])
    expect(mockLogout).not.toHaveBeenCalled()
    expect(pullMessages).toHaveBeenCalled()
  })

  it('logs out when every number is gone', async () => {
    mockRefreshUser.mockReturnValue(Effect.fail(new UserNotFoundError()))
    mockRefreshExtraNumber.mockReturnValue(Effect.fail(new UserNotFoundError()))
    mockDropPhoneNumbers.mockReturnValue(Either.left('last number'))

    await resume()

    expect(mockLogout).toHaveBeenCalled()
    expect(mockAddLostPhoneNumbersToNotice).not.toHaveBeenCalled()
  })

  it('clears the device when the account moved, whichever number reports it', async () => {
    mockRefreshUser.mockReturnValue(Effect.void)
    mockRefreshExtraNumber.mockReturnValue(
      Effect.fail(new LoggedInOnAnotherDeviceError())
    )

    await resume()

    expect(mockClearDevice).toHaveBeenCalled()
    expect(pullMessages).not.toHaveBeenCalled()
  })
})
