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

export class CannotRemoveMainPhoneNumberError extends Schema.TaggedError<CannotRemoveMainPhoneNumberError>(
  'CannotRemoveMainPhoneNumberError'
)('CannotRemoveMainPhoneNumberError', {}) {}

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

export const addPhoneNumberToSession = (
  session: SessionV2,
  toAdd: SessionPhoneNumber
): Either.Either<SessionV2, PhoneNumberAlreadyInAccountError> =>
  sessionHasPhoneNumber(session, toAdd.phoneNumber)
    ? Either.left(new PhoneNumberAlreadyInAccountError())
    : Either.right({
        ...session,
        extraPhoneNumbers: Array.append(session.extraPhoneNumbers ?? [], toAdd),
      })

/**
 * The main number anchors the account (backups are tied to it), so only extra
 * numbers can be removed.
 */
export const removePhoneNumbersFromSession = (
  session: SessionV2,
  toRemove: readonly E164PhoneNumber[]
): Either.Either<
  SessionV2,
  PhoneNumberNotInAccountError | CannotRemoveMainPhoneNumberError
> => {
  if (!Array.every(toRemove, (one) => sessionHasPhoneNumber(session, one)))
    return Either.left(new PhoneNumberNotInAccountError())
  if (Array.contains(toRemove, session.phoneNumber))
    return Either.left(new CannotRemoveMainPhoneNumberError())

  return Either.right({
    ...session,
    extraPhoneNumbers: Array.filter(
      session.extraPhoneNumbers ?? [],
      (one) => !Array.contains(toRemove, one.phoneNumber)
    ),
  })
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
