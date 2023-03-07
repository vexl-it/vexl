import type * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as Contacts from 'expo-contacts'
import {toE164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {ContactNormalized} from '../brands/ContactNormalized.brand'
import {SortTypes} from 'expo-contacts'

export interface PermissionsNotGranted {
  readonly _tag: 'PermissionsNotGranted'
}

export interface UnknownContactsError {
  readonly _tag: 'UnknownContactsError'
  readonly error: unknown
}

function normalizeContactPhoneNumbersOrNone(
  contact: Contacts.Contact
): ContactNormalized[] {
  const {name, phoneNumbers, image} = contact
  if (!phoneNumbers) {
    return []
  }

  const normalizedWithNulls = phoneNumbers.map(
    ({label, number, countryCode}) => {
      const normalizedNumber = toE164PhoneNumber(number ?? '', countryCode)

      if (O.isNone(normalizedNumber) || !number) {
        return null
      }

      const parseResult = ContactNormalized.safeParse({
        name,
        label,
        numberToDisplay: number,
        normalizedNumber: normalizedNumber.value,
        imageUri: image?.uri,
        fromContactList: true,
      })

      return parseResult.success ? parseResult.data : null
    }
  )

  return normalizedWithNulls.filter(
    (x): x is NonNullable<typeof x> => x !== null
  )
}

export default function getContactsAndTryToResolveThePermissionsAlongTheWay(): TE.TaskEither<
  PermissionsNotGranted | UnknownContactsError,
  ContactNormalized[]
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
        contacts.data.map(normalizeContactPhoneNumbersOrNone).flat()
      )
    } catch (error) {
      return E.left({_tag: 'UnknownContactsError', error} as const)
    }
  }
}
