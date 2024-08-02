import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  hmacSign,
  type CryptoError,
} from '@vexl-next/resources-utils/src/utils/crypto'
import * as Contacts from 'expo-contacts'
import {SortTypes} from 'expo-contacts'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import type * as TE from 'fp-ts/TaskEither'
import {hmacPassword} from '../../utils/environment'
import notEmpty from '../../utils/notEmpty'
import {startMeasure} from '../../utils/reportTime'
import {type ContactInfo} from './domain'
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
): E.Either<CryptoError, HashedPhoneNumber> {
  return pipe(
    normalizedPhoneNumber,
    hmacSign(hmacPassword),
    E.map(HashedPhoneNumber.parse)
  )
}

export async function areContactsPermissionsGranted(): Promise<boolean> {
  let contactsPermissions = await Contacts.getPermissionsAsync()
  if (!contactsPermissions.granted) {
    if (!contactsPermissions.canAskAgain) return false
    contactsPermissions = await Contacts.requestPermissionsAsync()
  }

  return contactsPermissions.granted
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

                return {
                  name: contact.name ?? number.number,
                  label: number.label,
                  numberToDisplay: number.number,
                  rawNumber: number.number,
                  imageUri:
                    contact.imageAvailable && contact.image
                      ? UriString.parse(contact.image.uri)
                      : undefined,
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
