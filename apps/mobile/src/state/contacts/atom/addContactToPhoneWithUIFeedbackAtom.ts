import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, Schema} from 'effect'
import * as Contacts from 'expo-contacts'
import {type Contact} from 'expo-contacts'
import {atom} from 'jotai'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import userSvg from '../../../components/images/userSvg'
import getCountryCode from '../../../utils/getCountryCode'
import {translationAtom} from '../../../utils/localization/I18nProvider'

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
      await Contacts.addContactAsync(contact)
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
                variant: 'greyOnWhite',
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
