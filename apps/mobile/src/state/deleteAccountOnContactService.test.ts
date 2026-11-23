import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  DeleteAccountRouteMissingError,
  InvalidLoginSessionProofError,
  LoggedInOnAnotherDeviceError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Either} from 'effect'
import {dummySession} from './session/dummySesssion'

const mockProof = {loginSessionId: 'session', loginSessionProof: 'proof'}
jest.mock('./session/loginSession', () => {
  const {Effect} = jest.requireActual('effect')
  return {loginSessionWithProof: () => Effect.succeed(mockProof)}
})

// eslint-disable-next-line import/first
import {deleteAccountOnContactService} from './deleteAccountOnContactService'

type DeleteAccountFailure =
  | DeleteAccountRouteMissingError
  | NotFoundError
  | LoggedInOnAnotherDeviceError
  | InvalidLoginSessionProofError

/* eslint-disable @typescript-eslint/explicit-function-return-type */
const makeContactApi = ({
  deleteAccountFailure,
  deleteUserFails = false,
}: {
  deleteAccountFailure?: DeleteAccountFailure
  deleteUserFails?: boolean
}) => ({
  deleteAccount: jest.fn((_request: unknown) =>
    deleteAccountFailure
      ? Effect.fail(deleteAccountFailure)
      : Effect.succeed({})
  ),
  deleteUser: jest.fn(() =>
    deleteUserFails
      ? Effect.fail(new NotFoundError({message: 'gone already'}))
      : Effect.succeed({})
  ),
})
/* eslint-enable @typescript-eslint/explicit-function-return-type */

it('asks every number to delete the account with a login session proof', async () => {
  const main = makeContactApi({})
  const extra = makeContactApi({})

  await Effect.runPromise(
    deleteAccountOnContactService({
      session: dummySession,
      contactApis: [main, extra],
    })
  )

  expect(main.deleteAccount).toHaveBeenCalledWith(mockProof)
  expect(extra.deleteAccount).toHaveBeenCalledWith(mockProof)
  expect(main.deleteUser).not.toHaveBeenCalled()
  expect(extra.deleteUser).not.toHaveBeenCalled()
})

it.each([
  ['without the delete account route', new DeleteAccountRouteMissingError()],
  ['answering not found', new NotFoundError()],
])(
  'deletes every number on its own on a contact-service %s',
  async (_, error) => {
    const main = makeContactApi({
      deleteAccountFailure: error,
      deleteUserFails: true,
    })
    const extra = makeContactApi({deleteAccountFailure: error})

    await Effect.runPromise(
      deleteAccountOnContactService({
        session: dummySession,
        contactApis: [main, extra],
      })
    )

    expect(main.deleteUser).toHaveBeenCalledTimes(1)
    expect(extra.deleteUser).toHaveBeenCalledTimes(1)
  }
)

it.each([
  ['logged in on another device', new LoggedInOnAnotherDeviceError()],
  ['an invalid proof', new InvalidLoginSessionProofError()],
])('deletes nothing more on %s', async (_, error) => {
  const main = makeContactApi({deleteAccountFailure: error})
  const extra = makeContactApi({})

  const result = await Effect.runPromise(
    Effect.either(
      deleteAccountOnContactService({
        session: dummySession,
        contactApis: [main, extra],
      })
    )
  )

  expect(result).toEqual(Either.left(error))
  expect(extra.deleteAccount).not.toHaveBeenCalled()
  expect(main.deleteUser).not.toHaveBeenCalled()
  expect(extra.deleteUser).not.toHaveBeenCalled()
})
