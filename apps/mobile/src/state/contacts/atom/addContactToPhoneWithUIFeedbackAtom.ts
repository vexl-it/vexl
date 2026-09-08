import {toNormalizedEmail} from '@vexl-next/domain/src/general/NormalizedEmail.brand'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  Contact,
  ContactField,
  type CreateContactRecord,
  type ExistingEmail,
  type ExistingPhone,
} from 'expo-contacts'
import {atom} from 'jotai'
import {askAreYouSureActionAtom} from '../../../components/GlobalDialog'
import userSvg from '../../../components/images/userSvg'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {type NormalizedContactValue} from '../domain'

export class ErrorAddingContactToPhoneContacts extends Schema.TaggedError<ErrorAddingContactToPhoneContacts>(
  'ErrorAddingContactToPhoneContacts'
)('ErrorAddingContactToPhoneContacts', {
  cause: Schema.Unknown,
}) {}

export interface ContactValuesToSave {
  readonly phoneNumber?: NormalizedContactValue | undefined
  readonly email?: NormalizedContactValue | undefined
}

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

function phoneNumberMatches(
  phone: ExistingPhone,
  phoneNumber: NormalizedContactValue
): boolean {
  return pipe(
    Option.fromNullable(phone.number),
    Option.flatMap(toE164PhoneNumberWithDefaultCountryCode),
    Option.contains(phoneNumber)
  )
}

function emailMatches(
  existingEmail: ExistingEmail,
  email: NormalizedContactValue
): boolean {
  return pipe(
    Option.fromNullable(existingEmail.address),
    Option.flatMap(toNormalizedEmail),
    Option.contains(email)
  )
}

function contactHasValue(
  contact: {phones: ExistingPhone[]; emails: ExistingEmail[]},
  {phoneNumber, email}: ContactValuesToSave
): boolean {
  return (
    (phoneNumber !== undefined &&
      Array.some(contact.phones, (phone) =>
        phoneNumberMatches(phone, phoneNumber)
      )) ||
    (email !== undefined &&
      Array.some(contact.emails, (existingEmail) =>
        emailMatches(existingEmail, email)
      ))
  )
}

function isContactOnPhone(
  values: ContactValuesToSave
): Effect.Effect<boolean, ErrorAddingContactToPhoneContacts> {
  return Effect.tryPromise({
    try: async () => {
      const contacts = await Contact.getAllDetails([
        ContactField.PHONES,
        ContactField.EMAILS,
      ])

      return Array.some(contacts, (contact) => contactHasValue(contact, values))
    },
    catch: (e) => new ErrorAddingContactToPhoneContacts({cause: e}),
  })
}

function addPhoneContactIfMissing({
  contact,
  values,
}: {
  contact: CreateContactRecord
  values: ContactValuesToSave
}): Effect.Effect<void, ErrorAddingContactToPhoneContacts> {
  return Effect.gen(function* (_) {
    const contactOnPhone = yield* _(isContactOnPhone(values))

    if (!contactOnPhone) {
      yield* _(addContactsToPhoneContacts({contact}))
    }
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

function createContactPayload({
  customName,
  phoneNumber,
  email,
}: {customName: string} & ContactValuesToSave): CreateContactRecord {
  const {firstName, lastName} = parseFirstAndLastName(customName)

  return {
    givenName: firstName,
    ...(lastName && {familyName: lastName}),
    ...(phoneNumber && {phones: [{number: phoneNumber, label: 'main'}]}),
    ...(email && {emails: [{address: email, label: 'main'}]}),
  }
}

function contactValuesPreview({
  phoneNumber,
  email,
}: ContactValuesToSave): string {
  return pipe(
    [phoneNumber, email],
    Array.filter((value) => value !== undefined),
    Array.join('\n')
  )
}

export const addContactToPhoneWithUIFeedbackActionAtom = atom(
  null,
  (
    get,
    set,
    {customName, ...values}: {customName: string} & ContactValuesToSave
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
              subtitle: contactValuesPreview(values),
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
      const contact = createContactPayload({
        customName: resolvedName,
        ...values,
      })

      yield* _(addPhoneContactIfMissing({contact, values}))

      return true
    })
  }
)

export const addContactToPhoneActionAtom = atom(
  null,
  (
    _get,
    _set,
    {customName, ...values}: {customName: string} & ContactValuesToSave
  ) => {
    return Effect.gen(function* (_) {
      const contact = createContactPayload({customName, ...values})
      yield* _(addPhoneContactIfMissing({contact, values}))

      return true
    })
  }
)
