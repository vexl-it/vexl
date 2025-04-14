import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  hmacSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  hmacSign,
  type CryptoError as CryptoErrorOld,
} from '@vexl-next/resources-utils/src/utils/crypto'
import {Effect, Schema} from 'effect'
import * as Contacts from 'expo-contacts'
import {SortTypes} from 'expo-contacts'
import * as E from 'fp-ts/Either'
import type * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {hmacPassword} from '../../utils/environment'
import notEmpty from '../../utils/notEmpty'
import {startMeasure} from '../../utils/reportTime'
import {NonUniqueContactId, type ContactInfo} from './domain'
// import toE164PhoneNumberWithDefaultCountryCode from '../../utils/toE164PhoneNumberWithDefaultCountryCode'

export interface PermissionsNotGranted {
  readonly _tag: 'PermissionsNotGranted'
}

export interface UnknownContactsError {
  readonly _tag: 'UnknownContactsError'
  readonly error: unknown
}

export function hashPhoneNumber(
  normalizedPhoneNumber: E164PhoneNumber
): E.Either<CryptoErrorOld, HashedPhoneNumber> {
  return pipe(
    normalizedPhoneNumber,
    hmacSign(hmacPassword),
    E.map(HashedPhoneNumber.parse)
  )
}

export function hashPhoneNumberE(
  normalizedPhoneNumber: E164PhoneNumber
): Effect.Effect<HashedPhoneNumber, CryptoError> {
  return hmacSignE(hmacPassword)(normalizedPhoneNumber).pipe(
    Effect.map(Schema.decodeSync(HashedPhoneNumberE))
  )
}

export async function areContactsPermissionsGranted(): Promise<boolean> {
  try {
    let contactsPermissions = await Contacts.getPermissionsAsync()
    if (!contactsPermissions.granted) {
      if (!contactsPermissions.canAskAgain) return false
      contactsPermissions = await Contacts.requestPermissionsAsync()
    }
    return contactsPermissions.granted
  } catch (e) {
    // TODO: check this with update to EXPO SDK 52
    // Contacts.requestPermissionsAsync() throws an error when the user denies the permission on iOS
    if (
      e instanceof Error &&
      'code' in e &&
      e.code === 'E_CONTACTS_ERROR_UNKNOWN'
    ) {
      return false
    }
  }
  return false
}

export function getContactsAndTryToResolveThePermissionsAlongTheWay(): TE.TaskEither<
  PermissionsNotGranted | UnknownContactsError,
  ContactInfo[]
> {
  return async () => {
    try {
      const contactsPermissionsGranted = await areContactsPermissionsGranted()

      if (!contactsPermissionsGranted) {
        return E.left({_tag: 'PermissionsNotGranted'} as const)
      }

      const measureAsyncCall = startMeasure(
        'Async call to get contacts - should not block'
      )
      const contacts = await Contacts.getContactsAsync({
        sort: SortTypes.UserDefault,
      })
      measureAsyncCall()

      const measure = startMeasure('Mapping contacts from system to our domain')
      const toReturn = E.right(
        contacts.data.flatMap(
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
                  nonUniqueContactId: NonUniqueContactId.parse(contact.id),
                  name,
                  label: number.label,
                  numberToDisplay: number.number,
                  rawNumber: number.number,
                } satisfies ContactInfo
              })
              .filter(notEmpty) ?? []
        )
      )
      measure()
      return toReturn
    } catch (error) {
      return E.left({_tag: 'UnknownContactsError', error} as const)
    }
  }
}
