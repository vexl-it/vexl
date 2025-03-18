import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {parsePhoneNumber} from 'awesome-phonenumber'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
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
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {
  type ContactComputedValues,
  type ContactInfo,
  type StoredContactWithComputedValues,
} from '../domain'
import {addContactToPhoneWithUIFeedbackAtom} from './addContactToPhoneWithUIFeedbackAtom'
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

const editExistingContact = atom(
  null,
  async (get, set, existingContact: StoredContactWithComputedValues) => {
    const {t} = get(translationAtom)
    const importedContacts = get(importedContactsAtom)

    await pipe(
      set(showCreateOrEditDialogAtom, {
        type: 'edit',
        contactName: existingContact.info.name,
        contactNumber: existingContact.computedValues.normalizedNumber,
      }),
      effectToTaskEither,
      TE.map((dialogActionResult) =>
        dialogActionResult[0]?.type === 'inputResult'
          ? dialogActionResult[0].value
          : existingContact.info.name
      ),
      TE.map((contactName) => {
        set(
          storedContactsAtom,
          importedContacts.map((contact) =>
            contact.computedValues?.normalizedNumber !==
            existingContact.computedValues.normalizedNumber
              ? contact
              : {...contact, info: {...contact.info, name: contactName}}
          )
        )
        return contactName
      }),
      TE.chainFirstW(() =>
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
        }).pipe(effectToTaskEither)
      ),
      TE.match(
        () => {
          // ignore user closed the dialog
        },
        () => {
          // everything OK
        }
      )
    )()
  }
)

const importContactActionAtom = atom(
  null,
  (get, set, newContact: StoredContactWithComputedValues) => {
    const contactApi = get(apiAtom).contact

    return pipe(
      TE.Do,
      TE.map((v) => {
        set(loadingOverlayDisplayedAtom, true)
        return v
      }),
      TE.chainFirstW(() =>
        effectToTaskEither(
          contactApi.importContacts({
            body: {
              contacts: [newContact.computedValues.hash],
              replace: false,
            },
          })
        )
      ),
      TE.map(() => {
        set(storedContactsAtom, (contacts) => [
          ...contacts.filter(
            (one) =>
              one.computedValues?.normalizedNumber !==
              newContact.computedValues.normalizedNumber
          ),
          {...newContact, flags: {...newContact.flags, imported: true}},
        ])

        set(loadingOverlayDisplayedAtom, false)
        return newContact
      })
    )
  }
)

const createContact = atom(
  null,
  (get, set, newContact: StoredContactWithComputedValues) => {
    const {t} = get(translationAtom)

    return pipe(
      set(showCreateOrEditDialogAtom, {
        type: 'create',
        contactNumber: newContact.computedValues.normalizedNumber,
        contactName: newContact.info.name,
      }),
      effectToTaskEither,
      TE.map((dialogActionResult) =>
        dialogActionResult[0]?.type === 'inputResult'
          ? dialogActionResult[0].value
          : newContact.computedValues.normalizedNumber
      ),
      TE.bindTo('customName'),
      TE.bindW('importedContact', ({customName}) =>
        set(importContactActionAtom, {
          ...newContact,
          info: {...newContact.info, name: customName},
        })
      ),
      TE.bindW('addToPhoneSuccess', ({customName, importedContact}) =>
        pipe(
          set(addContactToPhoneWithUIFeedbackAtom, {
            customName,
            number: importedContact.computedValues.normalizedNumber,
          }),
          TE.fromTask
        )
      ),
      TE.chainFirstTaskK(({addToPhoneSuccess, customName, importedContact}) => {
        return set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('addContactDialog.contactAdded'),
              description: t(
                addToPhoneSuccess
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
        }).pipe(effectToTaskEither)
      }),
      TE.match(
        (e) => {
          if (e._tag === 'UserDeclinedError') {
            // ignore user closed the dialog
            return
          }

          if (e._tag === 'ImportContactsQuotaReachedError') {
            Alert.alert(t('contacts.importContactsQuotaReachedError'))
            return
          }

          showErrorAlert({
            title:
              toCommonErrorMessage(e, get(translationAtom).t) ??
              t('common.unknownError'),
            error: e,
          })
        },
        () => {
          // everything OK
        }
      )
    )()
  }
)

export const addContactWithUiFeedbackAtom = atom(
  null,
  async (
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
    const existingContact = importedContacts.find(
      (importedContact) =>
        importedContact.computedValues?.normalizedNumber ===
        newContact.computedValues.normalizedNumber
    )

    if (existingContact) await set(editExistingContact, existingContact)
    else
      await set(createContact, {
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
