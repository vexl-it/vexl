import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Array, Effect, Option} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import userSvg from '../../../components/images/userSvg'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {
  getActiveRouteNameOutsideOfReact,
  safeNavigateBackOutsideReact,
} from '../../../utils/navigation'
import {showErrorAlertE} from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {
  type ContactComputedValues,
  type ContactInfo,
  type StoredContactWithComputedValues,
} from '../domain'
import {areContactsPermissionsGranted} from '../utils'
import {addContactToPhoneWithUIFeedbackActionAtom} from './addContactToPhoneWithUIFeedbackAtom'
import {importedContactsAtom, storedContactsAtom} from './contactsStore'

function safeParsePhoneNumber(contactNumber: E164PhoneNumber): string {
  try {
    return parsePhoneNumber(contactNumber).number?.international ?? ''
  } catch (err) {
    return ''
  }
}

const showCreateOrEditDialogAtom = atom(
  null,
  (
    get,
    set,
    params: {
      type: 'create' | 'edit'
      contactName?: string
      contactNumber: E164PhoneNumber
    }
  ) => {
    const {t} = get(translationAtom)
    const {type, contactName, contactNumber} = params
    const subtitle = safeParsePhoneNumber(contactNumber)

    return set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          title:
            type === 'edit'
              ? t('addContactDialog.contactAlreadyInContactList')
              : t('addContactDialog.addContact'),
          description:
            type === 'edit'
              ? t('addContactDialog.wouldYouLikeToChangeTheName', {
                  name: contactName,
                })
              : t('addContactDialog.addThisPhoneNumber'),
          subtitle,
          negativeButtonText:
            type === 'edit'
              ? t('addContactDialog.keepCurrent')
              : t('common.notNow'),
          positiveButtonText:
            type === 'edit'
              ? t('common.change')
              : t('addContactDialog.addContact'),
          type: 'StepWithInput',
          defaultValue: contactName,
          textInputProps: {
            autoCorrect: false,
            placeholder:
              type === 'edit'
                ? contactName
                : t('addContactDialog.addContactName'),
            variant: 'greyOnWhite',
            icon: userSvg,
          },
        },
      ],
    })
  }
)

const editExistingContactActionAtom = atom(
  null,
  (get, set, existingContact: StoredContactWithComputedValues) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const importedContacts = get(importedContactsAtom)

      const dialogActionResult = yield* _(
        set(showCreateOrEditDialogAtom, {
          type: 'edit',
          contactName: existingContact.info.name,
          contactNumber: existingContact.computedValues.normalizedNumber,
        })
      )

      const contactName =
        dialogActionResult[0]?.type === 'inputResult'
          ? dialogActionResult[0].value
          : existingContact.info.name

      set(
        storedContactsAtom,
        importedContacts.map((contact) =>
          contact.computedValues.hash !== existingContact.computedValues.hash
            ? {...contact, computedValues: Option.some(contact.computedValues)}
            : {
                ...contact,
                computedValues: Option.some(contact.computedValues),
                info: {...contact.info, name: contactName},
              }
        )
      )

      yield* _(
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('addContactDialog.contactUpdated'),
              description: t(
                'addContactDialog.youHaveSuccessfullyUpdatedContact'
              ),
              positiveButtonText: t('common.niceWithExclamationMark'),
            },
          ],
          variant: 'info',
        })
      )
    }).pipe(Effect.ignore)
  }
)

const importContactActionAtom = atom(
  null,
  (get, set, newContact: StoredContactWithComputedValues) => {
    return Effect.gen(function* (_) {
      const contactApi = get(apiAtom).contact

      set(loadingOverlayDisplayedAtom, true)

      yield* _(
        contactApi.importContacts({
          body: {
            contacts: [newContact.computedValues.hash],
            replace: false,
          },
        })
      )

      set(storedContactsAtom, (prev) => [
        ...Array.filter(
          prev,
          (contact) =>
            Option.isSome(contact.computedValues) &&
            contact.computedValues.value.normalizedNumber !==
              newContact.computedValues.normalizedNumber
        ),
        {
          ...newContact,
          computedValues: Option.some(newContact.computedValues),
          flags: {...newContact.flags, imported: true},
        },
      ])

      set(loadingOverlayDisplayedAtom, false)
      return newContact
    })
  }
)

const createContactWithUiFeedbackActionAtom = atom(
  null,
  (get, set, newContact: StoredContactWithComputedValues) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const result = yield* _(
        set(showCreateOrEditDialogAtom, {
          type: 'create',
          contactNumber: newContact.computedValues.normalizedNumber,
          contactName: newContact.info.name,
        })
      )

      const customName =
        result[0]?.type === 'inputResult'
          ? result[0].value
          : newContact.computedValues.normalizedNumber

      const importedContact = yield* _(
        set(importContactActionAtom, {
          ...newContact,
          info: {...newContact.info, name: customName},
        })
      )

      const contactsPermissionsGranted = yield* _(
        areContactsPermissionsGranted()
      )

      const addContactToPhoneSuccess = contactsPermissionsGranted
        ? yield* _(
            set(addContactToPhoneWithUIFeedbackActionAtom, {
              customName,
              number: importedContact.computedValues.normalizedNumber,
            }),
            Effect.catchTag('UserDeclinedError', () => Effect.succeed(false)),
            Effect.catchTag('ErrorAddingContactToPhoneContacts', (e) =>
              Effect.zipRight(
                showErrorAlertE({
                  title: t('contacts.errorAddingContactToYourPhoneContacts'),
                  error: e,
                }),
                Effect.succeed(false)
              )
            )
          )
        : false

      yield* _(
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('addContactDialog.contactAdded'),
              description: t(
                addContactToPhoneSuccess
                  ? 'addContactDialog.youHaveAddedContactToVexlAndPhoneContacts'
                  : 'addContactDialog.youHaveAddedContactToVexlContacts',
                {
                  contactName: customName,
                }
              ),
              positiveButtonText: t('common.niceWithExclamationMark'),
            },
          ],
          variant: 'info',
        })
      )
    }).pipe(
      Effect.match({
        onSuccess: () => {},
        onFailure(e) {
          if (e._tag === 'UserDeclinedError') {
            // ignore user closed the dialog
            return Effect.succeed(Effect.void)
          }

          if (e._tag === 'ImportContactsQuotaReachedError') {
            Alert.alert(t('contacts.importContactsQuotaReachedError'))
            return Effect.succeed(Effect.void)
          }

          return Effect.zipRight(
            showErrorAlertE({
              title:
                toCommonErrorMessage(e, get(translationAtom).t) ??
                t('common.unknownError'),
              error: e,
            }),
            Effect.succeed(Effect.void)
          )
        },
      })
    )
  }
)

export const addContactWithUiFeedbackActionAtom = atom(
  null,
  (
    get,
    set,
    newContact: {info: ContactInfo; computedValues: ContactComputedValues}
  ) => {
    // if we are on the SetContacts screen, we should navigate back to the previous screen
    // to avoid not showing added contact in the list
    if (getActiveRouteNameOutsideOfReact() === 'SetContacts') {
      safeNavigateBackOutsideReact()
    }
    const importedContacts = get(importedContactsAtom)
    const existingContact = Array.findFirst(
      importedContacts,
      (importedContact) =>
        importedContact.computedValues.normalizedNumber ===
        newContact.computedValues.normalizedNumber
    )

    return Option.isSome(existingContact)
      ? set(editExistingContactActionAtom, {
          ...existingContact.value,
          computedValues: existingContact.value.computedValues,
        })
      : set(createContactWithUiFeedbackActionAtom, {
          ...newContact,
          flags: {
            seen: true,
            imported: false,
            importedManually: true,
            invalidNumber: 'valid',
          },
        })
  }
)
