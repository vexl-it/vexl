import {PhoneNumberVerificationId} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Exit} from 'effect'
import {createStore, type Getter} from 'jotai'
import {type SessionPhoneNumber} from '../../brands/Session.brand'
import {dummySession} from '../session/dummySesssion'
import {makeExtraPhoneNumber} from '../session/extraPhoneNumber.testUtils'
import {
  addVerifiedPhoneNumberActionAtom,
  discardVerifiedPhoneNumberActionAtom,
  verifyPhoneNumberToAddActionAtom,
} from './addPhoneNumberActionAtoms'

const mockCreateUser = jest.fn((): Effect.Effect<void, Error> => Effect.void)
const mockDeleteContactUser = jest.fn(
  (_phoneNumber: SessionPhoneNumber): Effect.Effect<void, Error> => Effect.void
)
const mockDeleteUser = jest.fn(
  (_phoneNumber: SessionPhoneNumber): Effect.Effect<void, Error> => Effect.void
)
const mockSubmitContacts = jest.fn(() => Effect.succeed('success'))

jest.mock('../session', () => {
  const {atom} = jest.requireActual('jotai')
  const {dummySession} = jest.requireActual('../session/dummySesssion')
  return {sessionDataOrDummyAtom: atom(dummySession)}
})
jest.mock('../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {apiAtom: atom({user: {}})}
})
jest.mock('../../api/contactApiForSession', () => ({
  contactApiForPhoneNumber: (_: Getter, phoneNumber: SessionPhoneNumber) => ({
    createUser: () => mockCreateUser(),
    deleteUser: () => mockDeleteContactUser(phoneNumber),
  }),
  userApiForPhoneNumber: (_: Getter, phoneNumber: SessionPhoneNumber) => ({
    deleteUser: () => mockDeleteUser(phoneNumber),
  }),
}))
jest.mock('../../components/LoadingOverlayProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    withLoadingOverlayAtom: atom(null, () => (effect: unknown) => effect),
  }
})
jest.mock(
  '../../components/LoginFlow/api/initPhoneVerificationAtom',
  () => ({})
)
jest.mock('../../components/LoginFlow/api/verifyPhoneNumberAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    verifyPhoneNumberAtom: atom(null, () =>
      Effect.succeed({challenge: 'challenge'})
    ),
  }
})
jest.mock('../keyDerivation', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    createPhoneNumberKeysActionAtom: atom(null, () =>
      Effect.succeed(mockVerified)
    ),
  }
})
jest.mock('../session/upgradeSession', () => ({
  upgradeSessionCredentials: () => mockUpgradeSessionCredentials(),
}))
jest.mock('../session/verifyLoginChallenge', () => {
  const {Effect} = jest.requireActual('effect')
  return {
    verifyLoginChallenge: () => Effect.succeed(mockVerified.sessionCredentials),
  }
})
jest.mock('../contacts/atom/contactsStore', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    importedContactsAtom: atom([]),
    needsFullContactsReplaceAfterContactEditAtom: atom(false),
  }
})
jest.mock('../contacts/atom/submitContactsActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    submitContactsActionAtom: atom(null, () => mockSubmitContacts()),
  }
})

const verified = makeExtraPhoneNumber({
  phoneNumber: '+420777777777',
  hash: 'new-hash',
  index: 3,
})
const mockVerified = verified
const mockUpgradeSessionCredentials = jest.fn(
  (): Effect.Effect<unknown, Error> => Effect.fail(new Error('offline'))
)

const sessionOf = (
  store: ReturnType<typeof createStore>
): typeof dummySession => {
  const {sessionDataOrDummyAtom} = jest.requireMock('../session')
  return store.get(sessionDataOrDummyAtom)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('discardVerifiedPhoneNumberActionAtom', () => {
  it("deletes only the new key's user-service row and ignores failures", async () => {
    mockDeleteUser.mockReturnValueOnce(Effect.fail(new Error('gone')))

    await Effect.runPromise(
      createStore().set(discardVerifiedPhoneNumberActionAtom, verified)
    )

    expect(mockDeleteUser).toHaveBeenCalledWith(verified)
    // contact-service deletes the contacts of whoever holds the number there
    expect(mockDeleteContactUser).not.toHaveBeenCalled()
  })
})

describe('verifyPhoneNumberToAddActionAtom', () => {
  it("deletes the new key's user-service row when the auth upgrade fails", async () => {
    const exit = await Effect.runPromiseExit(
      createStore().set(verifyPhoneNumberToAddActionAtom, {
        phoneNumber: verified.phoneNumber,
        verificationId: PhoneNumberVerificationId.make(1),
        code: '123456',
      })
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(mockDeleteUser).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: verified.phoneNumber,
        sessionCredentials: verified.sessionCredentials,
      })
    )
    expect(mockDeleteContactUser).not.toHaveBeenCalled()
  })
})

describe('addVerifiedPhoneNumberActionAtom', () => {
  it('stores the number and imports contacts under it', async () => {
    const store = createStore()

    await Effect.runPromise(
      store.set(addVerifiedPhoneNumberActionAtom, verified)
    )

    expect(sessionOf(store).extraPhoneNumbers).toEqual([verified])
    expect(mockSubmitContacts).toHaveBeenCalled()
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('discards the verified number when createUser fails', async () => {
    const store = createStore()
    mockCreateUser.mockReturnValueOnce(Effect.fail(new Error('offline')))

    const exit = await Effect.runPromiseExit(
      store.set(addVerifiedPhoneNumberActionAtom, verified)
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(mockDeleteUser).toHaveBeenCalledWith(verified)
    expect(mockDeleteContactUser).not.toHaveBeenCalled()
    expect(sessionOf(store).extraPhoneNumbers).toBeUndefined()
    expect(mockSubmitContacts).not.toHaveBeenCalled()
  })

  it('discards the verified number when it is already in the account', async () => {
    const store = createStore()
    const exit = await Effect.runPromiseExit(
      store.set(addVerifiedPhoneNumberActionAtom, {
        ...verified,
        phoneNumber: dummySession.phoneNumber,
      })
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(mockDeleteUser).toHaveBeenCalledTimes(1)
  })
})
