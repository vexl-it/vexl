import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Either, Schema} from 'effect'
import {type SessionV2} from '../../brands/Session.brand'
import {dummySession} from './dummySesssion'
import {makeExtraPhoneNumber} from './extraPhoneNumber.testUtils'
import {
  addPhoneNumberToSession,
  mainPhoneNumberOfSession,
  ownPublicKeysOfSession,
  phoneNumbersOfSession,
  pickedPhoneNumberOrMain,
  removePhoneNumbersFromSession,
} from './sessionPhoneNumbers'

const second = makeExtraPhoneNumber({
  phoneNumber: '+420777777777',
  hash: 'second',
  index: 0,
})
const third = makeExtraPhoneNumber({
  phoneNumber: '+421905123456',
  hash: 'third',
  index: 1,
})

const session: SessionV2 = {...dummySession, extraPhoneNumbers: [second, third]}
const main = mainPhoneNumberOfSession(session)

const numbersOf = (result: Either.Either<SessionV2, unknown>): string[] =>
  Array.map(phoneNumbersOfSession(Either.getOrThrow(result)), (one) =>
    String(one.phoneNumber)
  )

it('lists the main number with the session keys first', () => {
  expect(phoneNumbersOfSession(session)).toEqual([main, second, third])
  expect(main.privateKey).toBe(session.privateKey)
  expect(main.keyPairV2).toBe(session.keyPairV2)
  expect(
    phoneNumbersOfSession({...session, extraPhoneNumbers: undefined})
  ).toEqual([main])
})

it('lists V1 and V2 keys of every number as own keys', () => {
  expect(ownPublicKeysOfSession(session)).toEqual([
    session.privateKey.publicKeyPemBase64,
    session.keyPairV2.publicKey,
    second.privateKey.publicKeyPemBase64,
    second.keyPairV2.publicKey,
    third.privateKey.publicKeyPemBase64,
    third.keyPairV2.publicKey,
  ])
})

it('adds a number after the existing ones', () => {
  const fourth = makeExtraPhoneNumber({
    phoneNumber: '+420602602602',
    hash: 'fourth',
    index: 2,
  })
  expect(numbersOf(addPhoneNumberToSession(session, fourth))).toEqual([
    main.phoneNumber,
    second.phoneNumber,
    third.phoneNumber,
    fourth.phoneNumber,
  ])
})

it('rejects a number the account already has', () => {
  for (const existing of [
    third,
    {...third, phoneNumber: session.phoneNumber},
  ]) {
    const result = addPhoneNumberToSession(session, existing)
    expect(Either.isLeft(result) && result.left._tag).toBe(
      'PhoneNumberAlreadyInAccountError'
    )
  }
})

it('removes an extra number and keeps the main one', () => {
  const result = Either.getOrThrow(
    removePhoneNumbersFromSession(session, [second.phoneNumber])
  )
  expect(result.phoneNumber).toBe(session.phoneNumber)
  expect(result.sessionCredentials).toBe(session.sessionCredentials)
  expect(result.privateKey).toBe(session.privateKey)
  expect(result.extraPhoneNumbers).toEqual([third])
})

it('never removes the main number, it carries the account key', () => {
  for (const toRemove of [
    [session.phoneNumber],
    [second.phoneNumber, session.phoneNumber],
  ]) {
    const result = removePhoneNumbersFromSession(session, toRemove)
    expect(Either.isLeft(result) && result.left._tag).toBe(
      'CannotRemoveMainPhoneNumberError'
    )
  }
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
