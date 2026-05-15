import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  addContactAsync,
  Fields,
  getContactsAsync,
  presentFormAsync,
  updateContactAsync,
  type Contact,
  type ExistingContact,
} from 'expo-contacts'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {askAreYouSureActionAtom} from '../../../components/GlobalDialog'
import userSvg from '../../../components/images/userSvg'
import getCountryCode from '../../../utils/getCountryCode'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {type NonUniqueContactId} from '../domain'

export class ErrorAddingContactToPhoneContacts extends Schema.TaggedError<ErrorAddingContactToPhoneContacts>(
  'ErrorAddingContactToPhoneContacts'
)('ErrorAddingContactToPhoneContacts', {
  cause: Schema.Unknown,
}) {}

function addContactsToPhoneContacts({
  contact,
}: {
  contact: Contact
}): Effect.Effect<void, ErrorAddingContactToPhoneContacts> {
  return Effect.tryPromise({
    try: async () => {
      await addContactAsync(contact)
    },
    catch: (e) => new ErrorAddingContactToPhoneContacts({cause: e}),
  })
}

function updateContactInPhoneContacts({
  contact,
}: {
  contact: {id: string} & Partial<Contact>
}): Effect.Effect<void, ErrorAddingContactToPhoneContacts> {
  return Effect.tryPromise({
    try: async () => {
      if (Platform.OS === 'android') {
        await presentFormAsync(contact.id)
      } else {
        await updateContactAsync(contact)
      }
    },
    catch: (e) => new ErrorAddingContactToPhoneContacts({cause: e}),
  })
}

function parseFirstAndLastName(customName: string): {
  firstName: string
  lastName?: string | undefined
} {
  const parts = customName.trim().split(' ')

  if (parts.length > 1) {
    const [firstName, ...rest] = parts
    return {firstName: firstName ?? customName, lastName: rest.join(' ')}
  } else if (parts.length === 1) {
    return {firstName: parts[0] ?? customName}
  }

  return {firstName: customName}
}

function findPhoneContactByNumber({
  number,
}: {
  number: E164PhoneNumber
}): Effect.Effect<
  Option.Option<ExistingContact>,
  ErrorAddingContactToPhoneContacts
> {
  return Effect.tryPromise({
    try: async () => {
      const contacts = await getContactsAsync({
        fields: [Fields.PhoneNumbers],
      })

      return pipe(
        contacts.data,
        Array.findFirst((contact) =>
          pipe(
            Option.fromNullable(contact.phoneNumbers),
            Option.match({
              onNone: () => false,
              onSome: (phoneNumbers) =>
                Array.some(phoneNumbers, (phoneNumber) =>
                  pipe(
                    Option.fromNullable(phoneNumber.number),
                    Option.flatMap((rawNumber) =>
                      toE164PhoneNumberWithDefaultCountryCode(rawNumber)
                    ),
                    Option.match({
                      onNone: () => false,
                      onSome: (normalizedNumber) => normalizedNumber === number,
                    })
                  )
                ),
            })
          )
        )
      )
    },
    catch: (e) => new ErrorAddingContactToPhoneContacts({cause: e}),
  })
}

function createContactPayload({
  customName,
  number,
}: {
  customName: string
  number: E164PhoneNumber
}): Contact {
  const {firstName, lastName} = parseFirstAndLastName(customName)

  return {
    name: firstName,
    firstName,
    ...(lastName && {lastName}),
    phoneNumbers: [
      {
        countryCode: getCountryCode(number).toString(),
        number,
        isPrimary: true,
        label: 'main',
      },
    ],
    contactType: 'person',
  }
}

export const addContactToPhoneWithUIFeedbackActionAtom = atom(
  null,
  (
    get,
    set,
    {customName, number}: {customName: string; number: E164PhoneNumber}
  ) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const dialogActionResult = yield* _(
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('addContactDialog.addToPhonesContacts'),
              description: t('addContactDialog.addContactDescription', {
                name: customName,
              }),
              positiveButtonText: t('common.yes'),
              negativeButtonText: t('common.skip'),
            },
            {
              type: 'StepWithInput',
              title: t('addContactDialog.addContact'),
              description: t('addContactDialog.wouldYouLikeToChangeTheName', {
                name: customName,
              }),
              subtitle: number,
              positiveButtonText: t('common.save'),
              defaultValue: customName,
              textInputProps: {
                autoCorrect: false,
                placeholder: customName,
                icon: userSvg,
              },
            },
          ],
          variant: 'info',
        })
      )

      const {firstName, lastName} = parseFirstAndLastName(
        dialogActionResult[1]?.type === 'inputResult'
          ? dialogActionResult[1].value
          : customName
      )

      const contact = {
        name: firstName,
        firstName,
        ...(lastName && {lastName}),
        phoneNumbers: [
          {
            countryCode: getCountryCode(number).toString(),
            number,
            isPrimary: true,
            label: 'main',
          },
        ],
        contactType: 'person',
      } satisfies Contact

      yield* _(addContactsToPhoneContacts({contact}))

      return true
    })
  }
)

export const addContactToPhoneActionAtom = atom(
  null,
  (
    _get,
    _set,
    {
      customName,
      number,
      phoneContactId,
    }: {
      customName: string
      number: E164PhoneNumber
      phoneContactId?: Option.Option<NonUniqueContactId>
    }
  ) => {
    return Effect.gen(function* (_) {
      const contact = createContactPayload({customName, number})
      const linkedPhoneContactId = Option.getOrUndefined(
        phoneContactId ?? Option.none()
      )

      if (linkedPhoneContactId !== undefined) {
        yield* _(
          updateContactInPhoneContacts({
            contact: {
              id: linkedPhoneContactId,
              name: contact.name,
              firstName: contact.firstName,
              lastName: contact.lastName,
              phoneNumbers: contact.phoneNumbers,
            },
          })
        )

        return true
      }

      const existingContact = yield* _(findPhoneContactByNumber({number}))

      if (Option.isSome(existingContact) && existingContact.value.id) {
        yield* _(
          updateContactInPhoneContacts({
            contact: {
              id: existingContact.value.id,
              name: contact.name,
              firstName: contact.firstName,
              lastName: contact.lastName,
              phoneNumbers: contact.phoneNumbers,
            },
          })
        )
      } else {
        yield* _(addContactsToPhoneContacts({contact}))
      }

      return true
    })
  }
)
