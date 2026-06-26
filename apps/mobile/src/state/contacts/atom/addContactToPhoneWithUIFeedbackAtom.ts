import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  Contact,
  ContactField,
  type ContactPatch,
  type CreateContactRecord,
  type ExistingPhone,
  type NewPhone,
} from 'expo-contacts'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {askAreYouSureActionAtom} from '../../../components/GlobalDialog'
import userSvg from '../../../components/images/userSvg'
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
  contact: CreateContactRecord
}): Effect.Effect<void, ErrorAddingContactToPhoneContacts> {
  return Effect.tryPromise({
    try: async () => {
      await Contact.create(contact)
    },
    catch: (e) => new ErrorAddingContactToPhoneContacts({cause: e}),
  })
}

function updateContactInPhoneContacts({
  id,
  customName,
  number,
}: {
  id: string
  customName: string
  number: E164PhoneNumber
}): Effect.Effect<void, ErrorAddingContactToPhoneContacts> {
  return Effect.tryPromise({
    try: async () => {
      if (Platform.OS === 'android') {
        await new Contact(id).editWithForm()
      } else {
        const contact = new Contact(id)

        await contact.patch(createContactNamePatch({customName}))
        await updatePhoneNumberInContact({contact, number})
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
}): Effect.Effect<Option.Option<string>, ErrorAddingContactToPhoneContacts> {
  return Effect.tryPromise({
    try: async () => {
      const contacts = await Contact.getAllDetails([ContactField.PHONES])

      return pipe(
        contacts,
        Array.findFirst((contact) =>
          Array.some(contact.phones, (phoneNumber) =>
            phoneNumberMatches({phoneNumber, number})
          )
        ),
        Option.map((contact) => contact.id)
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
}): CreateContactRecord {
  const {firstName, lastName} = parseFirstAndLastName(customName)

  return {
    givenName: firstName,
    ...(lastName && {familyName: lastName}),
    phones: [createContactPhonePayload({number})],
  }
}

function createContactNamePatch({
  customName,
}: {
  customName: string
}): ContactPatch {
  const {firstName, lastName} = parseFirstAndLastName(customName)

  return {
    givenName: firstName,
    familyName: lastName ?? null,
  }
}

function createContactPhonePayload({
  number,
}: {
  number: E164PhoneNumber
}): NewPhone {
  return {
    number,
    label: 'main',
  }
}

function phoneNumberMatches({
  phoneNumber,
  number,
}: {
  phoneNumber: ExistingPhone
  number: E164PhoneNumber
}): boolean {
  return pipe(
    Option.fromNullable(phoneNumber.number),
    Option.flatMap((rawNumber) =>
      toE164PhoneNumberWithDefaultCountryCode(rawNumber)
    ),
    Option.match({
      onNone: () => false,
      onSome: (normalizedNumber) => normalizedNumber === number,
    })
  )
}

async function updatePhoneNumberInContact({
  contact,
  number,
}: {
  contact: Contact
  number: E164PhoneNumber
}): Promise<void> {
  const newPhoneNumber = createContactPhonePayload({number})
  const existingPhoneNumbers = await contact.getPhones()
  const matchingPhoneNumber = pipe(
    existingPhoneNumbers,
    Array.findFirst((phoneNumber) => phoneNumberMatches({phoneNumber, number}))
  )

  if (Option.isSome(matchingPhoneNumber)) {
    await contact.updatePhone({
      ...matchingPhoneNumber.value,
      number,
      label: matchingPhoneNumber.value.label ?? newPhoneNumber.label,
    })
  } else {
    await contact.addPhone(newPhoneNumber)
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

      const resolvedName =
        dialogActionResult[1]?.type === 'inputResult'
          ? dialogActionResult[1].value
          : customName

      const contact = createContactPayload({customName: resolvedName, number})

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
            id: linkedPhoneContactId,
            customName,
            number,
          })
        )

        return true
      }

      const existingContactId = yield* _(findPhoneContactByNumber({number}))

      if (Option.isSome(existingContactId)) {
        yield* _(
          updateContactInPhoneContacts({
            id: existingContactId.value,
            customName,
            number,
          })
        )
      } else {
        yield* _(addContactsToPhoneContacts({contact}))
      }

      return true
    })
  }
)
