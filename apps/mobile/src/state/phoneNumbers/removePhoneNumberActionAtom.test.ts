import {Effect, Either, Exit} from 'effect'
import {createStore, type Getter} from 'jotai'
import {dummySession} from '../session/dummySesssion'
import {makeExtraPhoneNumber} from '../session/extraPhoneNumber.testUtils'
import {removePhoneNumberActionAtom} from './removePhoneNumberActionAtom'

const mockDeleteContactUser = jest.fn(
  (): Effect.Effect<void, Error> => Effect.void
)
const mockDeleteUser = jest.fn(() => Effect.void)
const mockDrop = jest.fn((_phoneNumbers: unknown) => Either.right(undefined))
const mockReencrypt = jest.fn(() => Effect.void)

const extra = makeExtraPhoneNumber({
  phoneNumber: '+420777777777',
  hash: 'extra-hash',
  index: 0,
})

jest.mock('../session', () => {
  const {atom} = jest.requireActual('jotai')
  const {dummySession} = jest.requireActual('../session/dummySesssion')
  return {
    sessionDataOrDummyAtom: atom({...dummySession, extraPhoneNumbers: []}),
  }
})
jest.mock('../../api/contactApiForSession', () => {
  const {atom} = jest.requireActual('jotai')
  const {sessionDataOrDummyAtom} = jest.requireMock('../session')
  const {phoneNumbersOfSession} = jest.requireActual(
    '../session/sessionPhoneNumbers'
  )
  return {
    phoneNumberApisAtom: atom((get: Getter) =>
      phoneNumbersOfSession(get(sessionDataOrDummyAtom)).map(
        (phoneNumber: unknown) => ({
          phoneNumber,
          contactApi: {deleteUser: () => mockDeleteContactUser()},
          userApi: {deleteUser: () => mockDeleteUser()},
        })
      )
    ),
  }
})
jest.mock('./dropPhoneNumbersFromSessionActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    dropPhoneNumbersFromSessionActionAtom: atom(
      null,
      (_get: unknown, _set: unknown, phoneNumbers: unknown) =>
        mockDrop(phoneNumbers)
    ),
  }
})
jest.mock(
  '../connections/atom/updateAndReencryptAllConnectionsActionAtom',
  () => {
    const {atom} = jest.requireActual('jotai')
    return {
      updateAndReencryptAllConnectionsActionAtom: atom(null, () =>
        mockReencrypt()
      ),
    }
  }
)

const setup = (): ReturnType<typeof createStore> => {
  const store = createStore()
  const {sessionDataOrDummyAtom} = jest.requireMock('../session')
  store.set(sessionDataOrDummyAtom, {
    ...dummySession,
    extraPhoneNumbers: [extra],
  })
  return store
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('refuses to remove the main number before touching any server', async () => {
  const exit = await Effect.runPromiseExit(
    setup().set(removePhoneNumberActionAtom, dummySession.phoneNumber)
  )

  expect(exit).toEqual(
    Exit.fail(
      expect.objectContaining({_tag: 'CannotRemoveMainPhoneNumberError'})
    )
  )
  expect(mockDeleteContactUser).not.toHaveBeenCalled()
  expect(mockDeleteUser).not.toHaveBeenCalled()
  expect(mockDrop).not.toHaveBeenCalled()
})

it('deletes an extra number from contact-service and user-service, then drops it', async () => {
  await Effect.runPromise(
    setup().set(removePhoneNumberActionAtom, extra.phoneNumber)
  )

  expect(mockDeleteContactUser).toHaveBeenCalledTimes(1)
  expect(mockDeleteUser).toHaveBeenCalledTimes(1)
  expect(mockDrop).toHaveBeenCalledWith([extra.phoneNumber])
  expect(mockReencrypt).toHaveBeenCalled()
})

it('keeps the number when the server refuses to delete it', async () => {
  mockDeleteContactUser.mockReturnValueOnce(Effect.fail(new Error('offline')))

  const exit = await Effect.runPromiseExit(
    setup().set(removePhoneNumberActionAtom, extra.phoneNumber)
  )

  expect(Exit.isFailure(exit)).toBe(true)
  expect(mockDrop).not.toHaveBeenCalled()
})
