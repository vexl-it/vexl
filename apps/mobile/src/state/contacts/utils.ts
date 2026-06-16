import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {
  hmacSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {hmacSign} from '@vexl-next/resources-utils/src/utils/crypto'
import {Effect, Schema} from 'effect'
import {
  getContactsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SortTypes,
} from 'expo-contacts/legacy'
import {map, type Either} from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {hmacPassword} from '../../utils/environment'
import reportError from '../../utils/reportError'
import {startMeasure} from '../../utils/reportTime'
import {
  mapContactsFromSystemToDomain,
  type DeviceContactsMappingResult,
} from './contactMapping'
import {type ContactInfo} from './domain'

export class ContactsPermissionsNotGrantedError extends Schema.TaggedError<ContactsPermissionsNotGrantedError>(
  'ContactsPermissionsNotGrantedError'
)('ContactsPermissionsNotGrantedError', {}) {}

export class UnknownContactsError extends Schema.TaggedError<UnknownContactsError>(
  'UnknownContactsError'
)('UnknownContactsError', {
  cause: Schema.Unknown,
}) {}

export function hashPhoneNumber(
  normalizedPhoneNumber: E164PhoneNumber
): Either<BasicError<'CryptoError'>, HashedPhoneNumber> {
  return pipe(
    normalizedPhoneNumber,
    hmacSign(hmacPassword),
    map(Schema.decodeSync(HashedPhoneNumber))
  )
}

export function hashPhoneNumberE(
  normalizedPhoneNumber: E164PhoneNumber
): Effect.Effect<HashedPhoneNumber, CryptoError> {
  return hmacSignE(hmacPassword)(normalizedPhoneNumber).pipe(
    Effect.map(Schema.decodeSync(HashedPhoneNumber))
  )
}

export function areContactsPermissionsGranted(): Effect.Effect<
  boolean,
  UnknownContactsError
> {
  return Effect.tryPromise({
    try: async () => {
      let contactsPermissions = await getPermissionsAsync()
      if (!contactsPermissions.granted) {
        if (!contactsPermissions.canAskAgain) return false
        contactsPermissions = await requestPermissionsAsync()
      }
      return contactsPermissions.granted
    },
    catch: (e) => {
      return new UnknownContactsError({cause: e})
    },
  })
}

export function areContactsPermissionsAlreadyGranted(): Effect.Effect<
  boolean,
  UnknownContactsError
> {
  return Effect.tryPromise({
    try: async () => {
      const contactsPermissions = await getPermissionsAsync()
      return contactsPermissions.granted
    },
    catch: (e) => {
      return new UnknownContactsError({cause: e})
    },
  })
}

export function getContactsAndTryToResolveThePermissionsAlongTheWay(): Effect.Effect<
  ContactInfo[],
  ContactsPermissionsNotGrantedError | UnknownContactsError
> {
  return Effect.gen(function* (_) {
    const contactsPermissionsGranted = yield* _(areContactsPermissionsGranted())

    if (!contactsPermissionsGranted) {
      return yield* _(Effect.fail(new ContactsPermissionsNotGrantedError()))
    }

    const measureAsyncCall = startMeasure(
      'Async call to get contacts - should not block'
    )

    const contacts = yield* _(
      Effect.tryPromise({
        try: async () =>
          await getContactsAsync({
            sort: SortTypes.UserDefault,
          }),
        catch: (e) => new UnknownContactsError({cause: e}),
      })
    )

    measureAsyncCall()

    const measure = startMeasure('Mapping contacts from system to our domain')
    const mappingResult: DeviceContactsMappingResult =
      mapContactsFromSystemToDomain(contacts.data)

    if (
      mappingResult.malformedContactsCount > 0 ||
      mappingResult.malformedPhoneNumbersCount > 0
    ) {
      reportError('warn', new Error('Skipped malformed contacts from device'), {
        malformedContactsCount: mappingResult.malformedContactsCount,
        malformedPhoneNumbersCount: mappingResult.malformedPhoneNumbersCount,
      })
    }

    measure()

    return mappingResult.contacts
  })
}
