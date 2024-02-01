import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  hmacSign,
  type CryptoError,
} from '@vexl-next/resources-utils/src/utils/crypto'
import * as Contacts from 'expo-contacts'
import {SortTypes} from 'expo-contacts'
import * as E from 'fp-ts/Either'
import type * as TE from 'fp-ts/TaskEither'
import {hmacPassword} from '../../utils/environment'
import notEmpty from '../../utils/notEmpty'
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
): E.Either<CryptoError, string> {
  return hmacSign(hmacPassword)(normalizedPhoneNumber)
}

export default function getContactsAndTryToResolveThePermissionsAlongTheWay(): TE.TaskEither<
  PermissionsNotGranted | UnknownContactsError,
  ContactInfo[]
> {
  return async () => {
    try {
      let contactsPermissions = await Contacts.getPermissionsAsync()
      if (!contactsPermissions.granted) {
        if (!contactsPermissions.canAskAgain)
          return E.left({_tag: 'PermissionsNotGranted'} as const)
        contactsPermissions = await Contacts.requestPermissionsAsync()
      }

      if (!contactsPermissions.granted)
        return E.left({_tag: 'PermissionsNotGranted'} as const)

      const contacts = await Contacts.getContactsAsync({
        sort: SortTypes.UserDefault,
      })

      return E.right(
        contacts.data.flatMap(
          (contact) =>
            contact.phoneNumbers
              ?.map((number) => {
                if (!number.number) return null

                return {
                  name: contact.name,
                  label: number.label,
                  numberToDisplay: number.number,
                  rawNumber: number.number,
                  imageUri: contact.image
                    ? UriString.parse(contact.image.uri)
                    : undefined,
                } satisfies ContactInfo
              })
              .filter(notEmpty) ?? []
        )
      )
    } catch (error) {
      return E.left({_tag: 'UnknownContactsError', error} as const)
    }
  }
}
