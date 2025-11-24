import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  hmacSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Array, Effect, Option, Schema} from 'effect'
import * as Contacts from 'expo-contacts'
import {SortTypes} from 'expo-contacts'
import {hmacPassword} from '../../utils/environment'
import notEmpty from '../../utils/notEmpty'
import {startMeasure} from '../../utils/reportTime'
import {NonUniqueContactIdE, type ContactInfo} from './domain'
// import toE164PhoneNumberWithDefaultCountryCode from '../../utils/toE164PhoneNumberWithDefaultCountryCode'

export class ContactsPermissionsNotGrantedError extends Schema.TaggedError<ContactsPermissionsNotGrantedError>(
  'ContactsPermissionsNotGrantedError'
)('ContactsPermissionsNotGrantedError', {}) {}

export class UnknownContactsError extends Schema.TaggedError<UnknownContactsError>(
  'UnknownContactsError'
)('UnknownContactsError', {
  cause: Schema.Unknown,
}) {}

export function hashPhoneNumberE(
  normalizedPhoneNumber: E164PhoneNumber
): Effect.Effect<HashedPhoneNumber, CryptoError> {
  return hmacSignE(hmacPassword)(normalizedPhoneNumber).pipe(
    Effect.map(Schema.decodeSync(HashedPhoneNumberE))
  )
}

// Old fp-ts version for backwards compatibility - deprecated, use hashPhoneNumberE
export function hashPhoneNumber(
  normalizedPhoneNumber: E164PhoneNumber
): Promise<
  {_tag: 'Left'; left: CryptoError} | {_tag: 'Right'; right: HashedPhoneNumber}
> {
  return Effect.runPromise(
    hashPhoneNumberE(normalizedPhoneNumber).pipe(
      Effect.map((value) => ({_tag: 'Right' as const, right: value})),
      Effect.catchAll((error) =>
        Effect.succeed({_tag: 'Left' as const, left: error})
      )
    )
  )
}

export function areContactsPermissionsGranted(): Effect.Effect<
  boolean,
  UnknownContactsError
> {
  return Effect.tryPromise({
    try: async () => {
      let contactsPermissions = await Contacts.getPermissionsAsync()
      if (!contactsPermissions.granted) {
        if (!contactsPermissions.canAskAgain) return false
        contactsPermissions = await Contacts.requestPermissionsAsync()
      }
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
          await Contacts.getContactsAsync({
            sort: SortTypes.UserDefault,
          }),
        catch: (e) => new UnknownContactsError({cause: e}),
      })
    )

    measureAsyncCall()

    const measure = startMeasure('Mapping contacts from system to our domain')
    const toReturn = Array.flatMap(
      contacts.data,
      (contact) =>
        contact.phoneNumbers
          ?.map((number) => {
            if (!number.number) return null

            const name =
              contact.name ??
              (!!contact.firstName || !!contact.lastName
                ? [contact.firstName, contact.lastName]
                    .filter(Boolean)
                    .join(' ')
                : undefined) ??
              number.number

            return {
              nonUniqueContactId: contact.id
                ? Option.some(
                    Schema.decodeSync(NonUniqueContactIdE)(contact.id)
                  )
                : Option.none(),
              name,
              label: Option.fromNullable(number.label),
              numberToDisplay: number.number,
              rawNumber: number.number,
            } satisfies ContactInfo
          })
          .filter(notEmpty) ?? []
    )

    measure()

    return toReturn
  })
}
