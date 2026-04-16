import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Array, Effect, Option} from 'effect'
import {atom} from 'jotai'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../../components/LoadingOverlayProvider'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {
  getActiveRouteNameOutsideOfReact,
  safeNavigateBackOutsideReact,
} from '../../../utils/navigation'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {
  type ContactComputedValues,
  type ContactInfo,
  type StoredContactWithComputedValues,
} from '../domain'
import {areContactsPermissionsGranted} from '../utils'
import {addContactToPhoneActionAtom} from './addContactToPhoneWithUIFeedbackAtom'
import {importedContactsAtom, storedContactsAtom} from './contactsStore'
import {showUpsertContactDialogAtom} from './showUpsertContactDialogAtom'

const editExistingContactActionAtom: ActionAtomType<
  [
    existingContact: StoredContactWithComputedValues & {
      avatar?: SvgStringOrImageUri
    },
  ],
  Effect.Effect<boolean, never>
> = atom(
  null,
  (
    get,
    set,
    existingContact: StoredContactWithComputedValues & {
      avatar?: SvgStringOrImageUri
    }
  ) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const importedContacts = get(importedContactsAtom)

      const {contactName, saveToPhone} = yield* _(
        set(showUpsertContactDialogAtom, {
          type: 'edit',
          contactName: existingContact.info.name,
          contactNumber: existingContact.computedValues.normalizedNumber,
          phoneContactId: existingContact.info.nonUniqueContactId,
          profileImage: existingContact.avatar,
        })
      )

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

      if (saveToPhone) {
        yield* _(
          areContactsPermissionsGranted(),
          Effect.flatMap((contactsPermissionsGranted) =>
            contactsPermissionsGranted
              ? set(addContactToPhoneActionAtom, {
                  customName: contactName,
                  number: existingContact.computedValues.normalizedNumber,
                })
              : Effect.succeed(false)
          )
        )
      }

      yield* _(
        set(globalDialogAtom, {
          title: t('addContactDialog.contactUpdated'),
          subtitle: t('addContactDialog.youHaveSuccessfullyUpdatedContact'),
          positiveButtonText: t('common.niceWithExclamationMark'),
        })
      )
      return true
    }).pipe(
      Effect.match({
        onSuccess: (success) => success,
        onFailure(e) {
          if (e._tag === 'ErrorAddingContactToPhoneContacts') {
            showErrorAlert({
              title: t('contacts.errorAddingContactToYourPhoneContacts'),
              error: e,
            })
            return false
          }

          if (e._tag === 'UserDeclinedError') {
            return false
          }

          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(e, get(translationAtom).t) ??
              t('common.somethingWentWrongDescription'),
            error: e,
          })

          return false
        },
      })
    )
  }
)

const importContactActionAtom = atom(
  null,
  (get, set, newContact: StoredContactWithComputedValues) => {
    return Effect.gen(function* (_) {
      const contactApi = get(apiAtom).contact

      set(loadingOverlayDisplayedAtom, true)

      const response = yield* _(
        contactApi.importContacts({
          contacts: [newContact.computedValues.hash],
          replace: false,
        })
      )
      const contactServerHash = Array.findFirst(
        response.phoneNumberHashesToServerToClientHash,
        (one) => one.hashedNumber === newContact.computedValues.hash
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
          contactServerHash,
          computedValues: Option.some(newContact.computedValues),
          flags: {...newContact.flags, imported: true},
        },
      ])

      set(loadingOverlayDisplayedAtom, false)
      return newContact
    })
  }
)

const createContactWithUiFeedbackActionAtom: ActionAtomType<
  [
    newContact: StoredContactWithComputedValues & {
      avatar?: SvgStringOrImageUri
    },
  ],
  Effect.Effect<boolean, never>
> = atom(
  null,
  (
    get,
    set,
    newContact: StoredContactWithComputedValues & {avatar?: SvgStringOrImageUri}
  ) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const {contactName: customName, saveToPhone} = yield* _(
        set(showUpsertContactDialogAtom, {
          type: 'create',
          contactNumber: newContact.computedValues.normalizedNumber,
          contactName: newContact.info.name,
          phoneContactId: newContact.info.nonUniqueContactId,
          profileImage: newContact.avatar,
        })
      )

      const importedContact = yield* _(
        set(importContactActionAtom, {
          ...newContact,
          info: {...newContact.info, name: customName},
        })
      )

      const addContactToPhoneSuccess = saveToPhone
        ? yield* _(
            areContactsPermissionsGranted(),
            Effect.flatMap((contactsPermissionsGranted) =>
              contactsPermissionsGranted
                ? set(addContactToPhoneActionAtom, {
                    customName,
                    number: importedContact.computedValues.normalizedNumber,
                  })
                : Effect.succeed(false)
            ),
            Effect.catchTag('ErrorAddingContactToPhoneContacts', (e) => {
              showErrorAlert({
                title: t('contacts.errorAddingContactToYourPhoneContacts'),
                error: e,
              })

              return Effect.succeed(false)
            })
          )
        : false

      yield* _(
        set(globalDialogAtom, {
          title: t('addContactDialog.contactAdded'),
          subtitle: t(
            addContactToPhoneSuccess
              ? 'addContactDialog.youHaveAddedContactToVexlAndPhoneContacts'
              : 'addContactDialog.youHaveAddedContactToVexlContacts',
            {
              contactName: customName,
            }
          ),
          positiveButtonText: t('common.niceWithExclamationMark'),
        })
      )
      return true
    }).pipe(
      Effect.match({
        onSuccess: (success) => success,
        onFailure(e) {
          if (e._tag === 'UserDeclinedError') {
            return false
          }

          if (e._tag === 'ImportContactsQuotaReachedError') {
            Alert.alert(t('contacts.importContactsQuotaReachedError'))
            return false
          }

          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(e, get(translationAtom).t) ??
              t('common.somethingWentWrongDescription'),
            error: e,
          })

          return false
        },
      })
    )
  }
)

export const addContactWithUiFeedbackActionAtom: ActionAtomType<
  [
    newContact: {
      info: ContactInfo
      computedValues: ContactComputedValues
      avatar?: SvgStringOrImageUri
    },
  ],
  Effect.Effect<boolean, never>
> = atom(
  null,
  (
    get,
    set,
    newContact: {
      info: ContactInfo
      computedValues: ContactComputedValues
      avatar?: SvgStringOrImageUri
    }
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
          avatar: newContact.avatar,
        })
      : set(createContactWithUiFeedbackActionAtom, {
          ...newContact,
          serverHashToClient: Option.none(),
          flags: {
            seen: true,
            imported: false,
            importedManually: true,
            invalidNumber: 'valid',
          },
        })
  }
)
