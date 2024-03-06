import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import * as Contacts from 'expo-contacts'
import {type Contact} from 'expo-contacts'
import * as E from 'fp-ts/Either'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import userSvg from '../../../components/images/userSvg'
import getCountryCode from '../../../utils/getCountryCode'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

export interface UnknownError {
  _tag: 'unknown'
  reason: 'Unknown'
  error?: unknown
}

function addContact({
  contact,
}: {
  contact: Contact
}): TE.TaskEither<UnknownError, 'success'> {
  return async () => {
    try {
      await Contacts.addContactAsync(contact)
      return E.right('success')
    } catch (error) {
      return E.left({_tag: 'unknown', reason: 'Unknown', error})
    }
  }
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

export const addContactToPhoneWithUIFeedbackAtom = atom(
  null,
  (
    get,
    set,
    {customName, number}: {customName: string; number: E164PhoneNumber}
  ): T.Task<boolean> => {
    const {t} = get(translationAtom)

    return pipe(
      TE.Do,
      TE.chainW(() =>
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('addContactDialog.alsoAddToPhoneContacts'),
              description: t('addContactDialog.addContactDescription', {
                name: customName,
                number,
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
      ),
      TE.map((dialogActionResult) => {
        return dialogActionResult[1]?.type === 'inputResult'
          ? dialogActionResult[1].value
          : customName
      }),
      TE.map((name) => parseFirstAndLastName(name)),
      TE.chainW(({firstName, lastName}) => {
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

        return addContact({contact})
      }),
      TE.match(
        (e) => {
          if (e._tag === 'unknown') {
            showErrorAlert({
              title:
                toCommonErrorMessage(e, get(translationAtom).t) ??
                t('common.unknownError'),
              error: e,
            })
          }

          // Ignore user chose not to add to phone contacts
          return false
        },
        () => {
          return true
        }
      )
    )
  }
)
