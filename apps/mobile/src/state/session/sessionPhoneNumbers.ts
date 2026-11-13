import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Either, Schema} from 'effect'
import {
  type ExtraSessionPhoneNumber,
  type SessionPhoneNumber,
  type SessionV2,
} from '../../brands/Session.brand'

export class PhoneNumberAlreadyInAccountError extends Schema.TaggedError<PhoneNumberAlreadyInAccountError>(
  'PhoneNumberAlreadyInAccountError'
)('PhoneNumberAlreadyInAccountError', {}) {}

export class PhoneNumberNotInAccountError extends Schema.TaggedError<PhoneNumberNotInAccountError>(
  'PhoneNumberNotInAccountError'
)('PhoneNumberNotInAccountError', {}) {}

// The main number carries the account key
export class CannotRemoveMainPhoneNumberError extends Schema.TaggedError<CannotRemoveMainPhoneNumberError>(
  'CannotRemoveMainPhoneNumberError'
)('CannotRemoveMainPhoneNumberError', {}) {}

export const mainPhoneNumberOfSession = (
  session: SessionV2
): SessionPhoneNumber => ({
  phoneNumber: session.phoneNumber,
  sessionCredentials: session.sessionCredentials,
  privateKey: session.privateKey,
  keyPairV2: session.keyPairV2,
})

/**
 * All phone numbers of the account, the main number first. Each number is a
 * separate identity on the servers, with its own keys.
 */
export const phoneNumbersOfSession = (
  session: SessionV2
): Array.NonEmptyReadonlyArray<SessionPhoneNumber> => [
  mainPhoneNumberOfSession(session),
  ...(session.extraPhoneNumbers ?? []),
]

/**
 * V1 and V2 public keys of every phone number of the account. They must never
 * be treated as someone else's.
 */
export const ownPublicKeysOfSession = (
  session: SessionV2
): ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2> =>
  Array.flatMap(phoneNumbersOfSession(session), (one) => [
    one.privateKey.publicKeyPemBase64,
    one.keyPairV2.publicKey,
  ])

export const identityKeyOfPhoneNumber = (
  phoneNumber: Pick<SessionPhoneNumber, 'privateKey'>
): PublicKeyPemBase64 => phoneNumber.privateKey.publicKeyPemBase64

/**
 * Drops results of identities no longer in the account. A number removed while
 * a refresh was fetching for it must not come back with that refresh.
 */
export const onlyIdentitiesOfSession = <
  T extends {readonly identity: PublicKeyPemBase64},
>(
  session: SessionV2,
  results: readonly T[]
): T[] => {
  const identities = Array.map(
    phoneNumbersOfSession(session),
    identityKeyOfPhoneNumber
  )
  return Array.filter(results, ({identity}) =>
    Array.contains(identities, identity)
  )
}

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
  toAdd: ExtraSessionPhoneNumber
): Either.Either<SessionV2, PhoneNumberAlreadyInAccountError> =>
  sessionHasPhoneNumber(session, toAdd.phoneNumber)
    ? Either.left(new PhoneNumberAlreadyInAccountError())
    : Either.right({
        ...session,
        extraPhoneNumbers: Array.append(session.extraPhoneNumbers ?? [], toAdd),
      })

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
