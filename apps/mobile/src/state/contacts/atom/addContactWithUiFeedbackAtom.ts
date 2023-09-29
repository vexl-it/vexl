import {atom} from 'jotai'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import userSvg from '../../../components/images/userSvg'
import {type ContactNormalized, type ContactNormalizedWithHash} from '../domain'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {privateApiAtom} from '../../../api'
import {hashPhoneNumber} from '../utils'
import * as E from 'fp-ts/Either'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {importedContactsAtom, importedContactsHashesAtom} from '../index'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import showErrorAlert from '../../../utils/showErrorAlert'

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
          textInputProps: {
            autoCorrect: false,
            placeholder:
              type === 'edit'
                ? contactName
                : t('addContactDialog.addContactName'),
            variant: 'greyOnWhite',
            icon: userSvg,
            defaultValue: contactName,
          },
        },
      ],
    })
  }
)

const editExistingContact = atom(
  null,
  async (get, set, existingContact: ContactNormalizedWithHash) => {
    const {t} = get(translationAtom)
    const importedContacts = get(importedContactsAtom)

    await pipe(
      set(showCreateOrEditDialogAtom, {
        type: 'edit',
        contactName: existingContact.name,
        contactNumber: existingContact.normalizedNumber,
      }),
      TE.map((dialogActionResult) =>
        dialogActionResult[0].type === 'inputResult'
          ? dialogActionResult[0].value
          : existingContact.name
      ),
      TE.map((contactName) => {
        set(
          importedContactsAtom,
          importedContacts.map((contact) =>
            contact.normalizedNumber !== existingContact.normalizedNumber
              ? contact
              : {...contact, name: contactName}
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
  (get, set, newContact: ContactNormalized) => {
    const contactApi = get(privateApiAtom).contact

    return pipe(
      hashPhoneNumber(newContact.normalizedNumber),
      E.map(
        (hash): ContactNormalizedWithHash => ({
          ...newContact,
          hash,
        })
      ),
      TE.fromEither,
      TE.map((v) => {
        set(loadingOverlayDisplayedAtom, true)
        return v
      }),
      TE.chainFirstW((contact) =>
        contactApi.importContacts({
          contacts: [contact.hash, ...get(importedContactsHashesAtom)],
        })
      ),
      TE.map((importedContact) => {
        set(importedContactsAtom, (contacts) => [
          ...contacts.filter(
            (one) => one.normalizedNumber !== importedContact.normalizedNumber
          ),
          importedContact,
        ])
        set(loadingOverlayDisplayedAtom, false)
        return importedContact
      }),
      TE.mapLeft((e) => e)
    )
  }
)

const createContact = atom(null, (get, set, newContact: ContactNormalized) => {
  const {t} = get(translationAtom)

  return pipe(
    set(showCreateOrEditDialogAtom, {
      type: 'create',
      contactNumber: newContact.normalizedNumber,
      contactName: newContact.name,
    }),
    TE.map((dialogActionResult) =>
      dialogActionResult[0].type === 'inputResult'
        ? dialogActionResult[0].value
        : newContact.normalizedNumber
    ),
    TE.bindTo('customName'),
    TE.bindW('importedContact', ({customName}) =>
      set(importContactActionAtom, {...newContact, name: customName})
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
})

export const addContactWithUiFeedbackAtom = atom(
  null,
  async (get, set, newContact: ContactNormalized) => {
    const importedContacts = get(importedContactsAtom)
    const existingContact = importedContacts.find(
      (importedContact) =>
        importedContact.normalizedNumber === newContact.normalizedNumber
    )

    if (existingContact) await set(editExistingContact, existingContact)
    else await set(createContact, newContact)
  }
)
