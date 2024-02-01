import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import userSvg from '../../../components/images/userSvg'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {
  type ContactComputedValues,
  type ContactInfo,
  type StoredContactWithComputedValues,
} from '../domain'
import {
  importedContactsAtom,
  importedContactsHashesAtom,
  storedContactsAtom,
} from './contactsStore'

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
          subtitle: contactNumber,
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
        })
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
    const contactApi = get(privateApiAtom).contact

    return pipe(
      TE.Do,
      TE.map((v) => {
        set(loadingOverlayDisplayedAtom, true)
        return v
      }),
      TE.chainFirstW(() =>
        contactApi.importContacts({
          contacts: [
            newContact.computedValues.hash,
            ...get(importedContactsHashesAtom),
          ],
        })
      ),
      TE.map(() => {
        set(storedContactsAtom, (contacts) => [
          ...contacts.filter(
            (one) =>
              one.computedValues?.normalizedNumber !==
              newContact.computedValues.normalizedNumber
          ),
          newContact,
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
      TE.chainFirstW(({customName}) =>
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('addContactDialog.contactAdded'),
              description: t('addContactDialog.youHaveAddedContact', {
                contactName: customName,
              }),
              positiveButtonText: t('common.niceWithExclamationMark'),
            },
          ],
          variant: 'info',
        })
      ),
      TE.match(
        (e) => {
          if (e._tag === 'UserDeclinedError') {
            // ignore user closed the dialog
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
