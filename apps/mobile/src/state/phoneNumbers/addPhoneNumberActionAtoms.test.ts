import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, Schema} from 'effect'
import {createStore, type PrimitiveAtom} from 'jotai'

const mockCreateUser = jest.fn(() => Effect.void)
const mockSubmitContacts = jest.fn((_params: unknown) =>
  Effect.succeed('success')
)

jest.mock('../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {apiAtom: atom({})}
})
jest.mock('../../api/contactApiForSession', () => ({
  contactApiForPhoneNumber: () => ({createUser: mockCreateUser}),
}))
jest.mock('../../components/LoadingOverlayProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    withLoadingOverlayAtom: atom(null, () => (effect: unknown) => effect),
  }
})
jest.mock('../../components/LoginFlow/api/initPhoneVerificationAtom', () => ({
  initPhoneVerificationAtom: null,
}))
jest.mock('../../components/LoginFlow/api/verifyPhoneNumberAtom', () => ({
  verifyPhoneNumberAtom: null,
}))
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
    submitContactsActionAtom: atom(
      null,
      (_get: unknown, _set: unknown, params: unknown) =>
        mockSubmitContacts(params)
    ),
  }
})
jest.mock('../session', () => {
  const {atom} = jest.requireActual('jotai')
  const {dummySession} = jest.requireActual('../session/dummySesssion')
  return {sessionDataOrDummyAtom: atom(dummySession)}
})
jest.mock('../session/loginSession', () => {
  const {Effect} = jest.requireActual('effect')
  return {loginSessionWithProof: () => Effect.succeed({})}
})
jest.mock('../session/upgradeSession', () => ({}))
jest.mock('../session/verifyLoginChallenge', () => ({}))

// eslint-disable-next-line import/first
import {needsFullContactsReplaceAfterContactEditAtom} from '../contacts/atom/contactsStore'
// eslint-disable-next-line import/first
import {sessionDataOrDummyAtom} from '../session'
// eslint-disable-next-line import/first
import {dummySession} from '../session/dummySesssion'
// eslint-disable-next-line import/first
import {addVerifiedPhoneNumberActionAtom} from './addPhoneNumberActionAtoms'

const {importedContactsAtom} = jest.requireMock<{
  importedContactsAtom: PrimitiveAtom<
    Array<{computedValues: {normalizedNumber: string}}>
  >
}>('../contacts/atom/contactsStore')

const numberToAdd = {
  phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420777777777'),
  sessionCredentials: dummySession.sessionCredentials,
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('sends the imported contacts again once the number is added', async () => {
  const store = createStore()
  store.set(importedContactsAtom, [
    {computedValues: {normalizedNumber: '+420601100000'}},
  ])

  await Effect.runPromise(
    store.set(addVerifiedPhoneNumberActionAtom, numberToAdd)
  )

  expect(mockCreateUser).toHaveBeenCalled()
  expect(store.get(sessionDataOrDummyAtom).extraPhoneNumbers).toEqual([
    numberToAdd,
  ])
  expect(store.get(needsFullContactsReplaceAfterContactEditAtom)).toBe(true)
  expect(mockSubmitContacts).toHaveBeenCalledWith(
    expect.objectContaining({numbersToImport: ['+420601100000']})
  )
})

it.each([
  ['none are imported on this device', []],
  [
    'only numbers of the account are imported',
    [
      {computedValues: {normalizedNumber: '+420777777777'}},
      {computedValues: {normalizedNumber: dummySession.phoneNumber}},
    ],
  ],
])('leaves the contacts on the server alone when %s', async (_, imported) => {
  const store = createStore()
  store.set(importedContactsAtom, imported)

  await Effect.runPromise(
    store.set(addVerifiedPhoneNumberActionAtom, numberToAdd)
  )

  expect(store.get(sessionDataOrDummyAtom).extraPhoneNumbers).toEqual([
    numberToAdd,
  ])
  expect(store.get(needsFullContactsReplaceAfterContactEditAtom)).toBe(true)
  expect(mockSubmitContacts).not.toHaveBeenCalled()
})
