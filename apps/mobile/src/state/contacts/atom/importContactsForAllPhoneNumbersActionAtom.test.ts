import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Effect, Schema} from 'effect'
import {createStore} from 'jotai'
import {importContactsForAllPhoneNumbersActionAtom} from './importContactsForAllPhoneNumbersActionAtom'

const mockEvents: string[] = []
const mockContactApi = (phoneNumber: string): unknown => ({
  importContacts: () =>
    Effect.gen(function* () {
      mockEvents.push(`start ${phoneNumber}`)
      yield* Effect.sleep(10)
      mockEvents.push(`end ${phoneNumber}`)
      return {imported: true, message: 'ok'}
    }),
})

jest.mock('../../../api/contactApiForSession', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    contactApisAtom: atom(() => [
      mockContactApi('main'),
      mockContactApi('extra'),
    ]),
  }
})
jest.mock('../../session', () => {
  const {atom} = jest.requireActual('jotai')
  const {dummySession} = jest.requireActual('../../session/dummySesssion')
  return {sessionDataOrDummyAtom: atom(dummySession)}
})
jest.mock('./contactsStore', () => {
  const {atom} = jest.requireActual('jotai')
  return {needsFullContactsReplaceAfterContactEditAtom: atom(false)}
})

it('imports under one phone number after another', async () => {
  await Effect.runPromise(
    createStore().set(importContactsForAllPhoneNumbersActionAtom, {
      contacts: [Schema.decodeSync(HashedPhoneNumber)('friend')],
      replace: false,
    })
  )

  expect(mockEvents).toEqual([
    'start main',
    'end main',
    'start extra',
    'end extra',
  ])
})
