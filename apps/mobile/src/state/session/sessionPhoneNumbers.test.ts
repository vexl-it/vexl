import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Either, Schema} from 'effect'
import {
  type SessionPhoneNumber,
  type SessionV2,
} from '../../brands/Session.brand'
import {dummySession} from './dummySesssion'
import {
  addPhoneNumberToSession,
  phoneNumbersOfSession,
  pickedPhoneNumberOrMain,
  removePhoneNumbersFromSession,
} from './sessionPhoneNumbers'

const phoneNumber = (number: string, hash: string): SessionPhoneNumber => ({
  phoneNumber: Schema.decodeSync(E164PhoneNumber)(number),
  sessionCredentials: {
    ...dummySession.sessionCredentials,
    hash: Schema.decodeSync(HashedPhoneNumber)(hash),
  },
})

const main = phoneNumber('+420733733733', 'main')
const second = phoneNumber('+420777777777', 'second')
const third = phoneNumber('+421905123456', 'third')

const session: SessionV2 = {
  ...dummySession,
  phoneNumber: main.phoneNumber,
  sessionCredentials: main.sessionCredentials,
  extraPhoneNumbers: [second, third],
}

const numbersOf = (result: Either.Either<SessionV2, unknown>): string[] =>
  Array.map(phoneNumbersOfSession(Either.getOrThrow(result)), (one) =>
    String(one.phoneNumber)
  )

it('lists the main number first', () => {
  expect(phoneNumbersOfSession(session)).toEqual([main, second, third])
  expect(
    phoneNumbersOfSession({...session, extraPhoneNumbers: undefined})
  ).toEqual([main])
})

it('adds a number after the existing ones', () => {
  const fourth = phoneNumber('+420602602602', 'fourth')
  expect(numbersOf(addPhoneNumberToSession(session, fourth))).toEqual([
    main.phoneNumber,
    second.phoneNumber,
    third.phoneNumber,
    fourth.phoneNumber,
  ])
})

it('rejects a number the account already has', () => {
  const result = addPhoneNumberToSession(session, third)
  expect(Either.isLeft(result) && result.left._tag).toBe(
    'PhoneNumberAlreadyInAccountError'
  )
})

it('removes an extra number and keeps the main one', () => {
  const result = Either.getOrThrow(
    removePhoneNumbersFromSession(session, [second.phoneNumber])
  )
  expect(result.phoneNumber).toBe(main.phoneNumber)
  expect(result.sessionCredentials).toBe(main.sessionCredentials)
  expect(result.extraPhoneNumbers).toEqual([third])
})

it('promotes the first extra number when the main one is removed', () => {
  const result = Either.getOrThrow(
    removePhoneNumbersFromSession(session, [main.phoneNumber])
  )
  expect(result.phoneNumber).toBe(second.phoneNumber)
  expect(result.sessionCredentials).toBe(second.sessionCredentials)
  expect(result.extraPhoneNumbers).toEqual([third])
  expect(result.privateKey).toBe(session.privateKey)
})

it('never removes the last number', () => {
  const result = removePhoneNumbersFromSession(session, [
    main.phoneNumber,
    second.phoneNumber,
    third.phoneNumber,
  ])
  expect(Either.isLeft(result) && result.left._tag).toBe(
    'CannotRemoveLastPhoneNumberError'
  )
})

it('refuses to remove a number the account does not have', () => {
  const result = removePhoneNumbersFromSession(session, [
    Schema.decodeSync(E164PhoneNumber)('+420602602602'),
  ])
  expect(Either.isLeft(result) && result.left._tag).toBe(
    'PhoneNumberNotInAccountError'
  )
})

describe('pickedPhoneNumberOrMain', () => {
  const accountPhoneNumbers = Array.make(main.phoneNumber, second.phoneNumber)

  it('keeps the picked number while it is in the account', () => {
    expect(
      pickedPhoneNumberOrMain(accountPhoneNumbers, second.phoneNumber)
    ).toBe(second.phoneNumber)
  })

  it('falls back to the main number when nothing is picked', () => {
    expect(pickedPhoneNumberOrMain(accountPhoneNumbers, undefined)).toBe(
      main.phoneNumber
    )
  })

  it('falls back to the main number when the picked one was removed', () => {
    expect(
      pickedPhoneNumberOrMain(accountPhoneNumbers, third.phoneNumber)
    ).toBe(main.phoneNumber)
  })
})
