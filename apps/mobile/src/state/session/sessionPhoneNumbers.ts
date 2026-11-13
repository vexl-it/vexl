import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Either, Schema} from 'effect'
import {
  type SessionPhoneNumber,
  type SessionV2,
} from '../../brands/Session.brand'

export class PhoneNumberAlreadyInAccountError extends Schema.TaggedError<PhoneNumberAlreadyInAccountError>(
  'PhoneNumberAlreadyInAccountError'
)('PhoneNumberAlreadyInAccountError', {}) {}

export class PhoneNumberNotInAccountError extends Schema.TaggedError<PhoneNumberNotInAccountError>(
  'PhoneNumberNotInAccountError'
)('PhoneNumberNotInAccountError', {}) {}

export class CannotRemoveLastPhoneNumberError extends Schema.TaggedError<CannotRemoveLastPhoneNumberError>(
  'CannotRemoveLastPhoneNumberError'
)('CannotRemoveLastPhoneNumberError', {}) {}

/**
 * All phone numbers of the account, the main number first.
 */
export const phoneNumbersOfSession = (
  session: SessionV2
): Array.NonEmptyReadonlyArray<SessionPhoneNumber> => [
  {
    phoneNumber: session.phoneNumber,
    sessionCredentials: session.sessionCredentials,
  },
  ...(session.extraPhoneNumbers ?? []),
]

export const sessionHasPhoneNumber = (
  session: SessionV2,
  phoneNumber: E164PhoneNumber
): boolean =>
  Array.some(
    phoneNumbersOfSession(session),
    (one) => one.phoneNumber === phoneNumber
  )

const withPhoneNumbers = (
  session: SessionV2,
  [main, ...extraPhoneNumbers]: Array.NonEmptyReadonlyArray<SessionPhoneNumber>
): SessionV2 => ({
  ...session,
  phoneNumber: main.phoneNumber,
  sessionCredentials: main.sessionCredentials,
  extraPhoneNumbers,
})

export const addPhoneNumberToSession = (
  session: SessionV2,
  toAdd: SessionPhoneNumber
): Either.Either<SessionV2, PhoneNumberAlreadyInAccountError> =>
  sessionHasPhoneNumber(session, toAdd.phoneNumber)
    ? Either.left(new PhoneNumberAlreadyInAccountError())
    : Either.right(
        withPhoneNumbers(
          session,
          Array.append(phoneNumbersOfSession(session), toAdd)
        )
      )

/**
 * Removing the main number promotes the first remaining one to main.
 */
export const removePhoneNumbersFromSession = (
  session: SessionV2,
  toRemove: readonly E164PhoneNumber[]
): Either.Either<
  SessionV2,
  PhoneNumberNotInAccountError | CannotRemoveLastPhoneNumberError
> => {
  if (!Array.every(toRemove, (one) => sessionHasPhoneNumber(session, one)))
    return Either.left(new PhoneNumberNotInAccountError())

  const remaining = Array.filter(
    phoneNumbersOfSession(session),
    (one) => !Array.contains(toRemove, one.phoneNumber)
  )

  return Array.isNonEmptyReadonlyArray(remaining)
    ? Either.right(withPhoneNumbers(session, remaining))
    : Either.left(new CannotRemoveLastPhoneNumberError())
}

/**
 * The picked number while it is still in the account, otherwise the main one.
 */
export const pickedPhoneNumberOrMain = (
  accountPhoneNumbers: Array.NonEmptyReadonlyArray<E164PhoneNumber>,
  picked: E164PhoneNumber | undefined
): E164PhoneNumber =>
  picked !== undefined && Array.contains(accountPhoneNumbers, picked)
    ? picked
    : Array.headNonEmpty(accountPhoneNumbers)
