import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {createScope, molecule} from 'bunshi/dist/react'
import {Array, Effect, Option, Schema, pipe} from 'effect'
import {
  getPermissionsAsync,
  type ContactsPermissionResponse,
} from 'expo-contacts'
import {atom, type SetStateAction} from 'jotai'
import {atomFamily, splitAtom} from 'jotai/utils'
import {matchSorter, rankings} from 'match-sorter'
import {Linking} from 'react-native'
import {addContactToPhoneActionAtom} from '../../../../state/contacts/atom/addContactToPhoneWithUIFeedbackAtom'
import {storedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from '../../../../state/contacts/atom/loadContactsFromDeviceActionAtom'
import normalizeStoredContactsActionAtom from '../../../../state/contacts/atom/normalizeStoredContactsActionAtom'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {
  StoredContactWithComputedValues,
  type ContactsFilter,
} from '../../../../state/contacts/domain'
import {
  areContactsPermissionsGranted,
  hashPhoneNumberE,
} from '../../../../state/contacts/utils'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import deduplicate, {deduplicateBy} from '../../../../utils/deduplicate'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
import {createUpdateContactActionAtom} from './createUpdateContactActionAtom'

export const ContactsSelectScope = createScope<{
  normalizedContacts: StoredContactWithComputedValues[]
  reloadContacts: () => void
}>({
  reloadContacts: () => {},
  normalizedContacts: [],
})

const matchSorterKeys = ['info.name', 'info.numberToDisplay']
const matchSorterThreshold = rankings.CONTAINS

const addNewContactSelectedCountryCodeAtom = atom<string | undefined>(undefined)

export const contactSelectMolecule = molecule((_, getScope) => {
  const {normalizedContacts, reloadContacts} = getScope(ContactsSelectScope)

  const searchTextAtom = atom('')
  const contactsFilterAtom = atom<ContactsFilter>('all')

  const newContactsToDisplayAtom = atom((get) => {
    const searchText = get(searchTextAtom)

    const contactsToShow = deduplicateBy(
      normalizedContacts.filter((one) => !one.flags.seen),
      (one) => one.computedValues.normalizedNumber
    )

    return matchSorter(contactsToShow, searchText, {
      keys: matchSorterKeys,
      threshold: matchSorterThreshold,
    })
  })

  const submittedContactsToDisplayAtom = atom((get) => {
    const searchText = get(searchTextAtom)

    const contactsToShow = deduplicateBy(
      normalizedContacts.filter((one) => one.flags.imported),
      (one) => one.computedValues.normalizedNumber
    )

    return matchSorter(contactsToShow, searchText, {
      keys: matchSorterKeys,
      threshold: matchSorterThreshold,
    })
  })

  const nonSubmittedContactsToDisplayAtom = atom((get) => {
    const searchText = get(searchTextAtom)

    const contactsToShow = deduplicateBy(
      normalizedContacts.filter((one) => !one.flags.imported && one.flags.seen),
      (one) => one.computedValues.normalizedNumber
    )

    return matchSorter(contactsToShow, searchText, {
      keys: matchSorterKeys,
      threshold: matchSorterThreshold,
    })
  })

  const allContactsToDisplayAtom = atom((get) => {
    const searchText = get(searchTextAtom)

    const normalizedNumbers = deduplicateBy(
      normalizedContacts,
      (one) => one.computedValues.normalizedNumber
    )

    return matchSorter(normalizedNumbers, searchText, {
      keys: matchSorterKeys,
      threshold: matchSorterThreshold,
    })
  })

  const _contactsToDisplayAtom = atom((get) => {
    const contactsFilter = get(contactsFilterAtom)

    return get(
      contactsFilter === 'submitted'
        ? submittedContactsToDisplayAtom
        : contactsFilter === 'nonSubmitted'
          ? nonSubmittedContactsToDisplayAtom
          : contactsFilter === 'new'
            ? newContactsToDisplayAtom
            : allContactsToDisplayAtom
    )
  })

  const newContactsToDisplayAtomsAtom = splitAtom(newContactsToDisplayAtom)
  const submittedContactsToDisplayAtomsAtom = splitAtom(
    submittedContactsToDisplayAtom
  )
  const nonSubmittedContactsToDisplayAtomsAtom = splitAtom(
    nonSubmittedContactsToDisplayAtom
  )
  const allContactsToDisplayAtomsAtom = splitAtom(allContactsToDisplayAtom)

  const newContactsToDisplayCountAtom = atom(
    (get) => get(newContactsToDisplayAtomsAtom).length
  )
  const submittedContactsToDisplayCountAtom = atom(
    (get) => get(submittedContactsToDisplayAtomsAtom).length
  )
  const nonSubmittedContactsToDisplayCountAtom = atom(
    (get) => get(nonSubmittedContactsToDisplayAtomsAtom).length
  )
  const allContactsToDisplayCountAtom = atom(
    (get) => get(allContactsToDisplayAtomsAtom).length
  )
  const contactsAccessPrivilegesAtom = atom<
    ContactsPermissionResponse['accessPrivileges'] | undefined
  >()
  const contactsPermissionResponseAtom = atom<
    ContactsPermissionResponse | undefined
  >()
  const shouldOpenContactsSettingsAtom = atom((get) => {
    const contactsPermissionResponse = get(contactsPermissionResponseAtom)

    return (
      contactsPermissionResponse != null &&
      !contactsPermissionResponse.granted &&
      !contactsPermissionResponse.canAskAgain
    )
  })
  const displayInfoAboutContactsAccessPrivilegesAtom = atom<boolean>(false)

  const checkContactsAccessPrivilegesActionAtom = atom(null, (get, set) => {
    return Effect.tryPromise({
      try: async () => {
        const contactsPermissions = await getPermissionsAsync()
        set(contactsPermissionResponseAtom, contactsPermissions)
        set(contactsAccessPrivilegesAtom, contactsPermissions.accessPrivileges)
        set(
          displayInfoAboutContactsAccessPrivilegesAtom,
          contactsPermissions.accessPrivileges === 'limited'
        )
      },
      catch: () => {
        // ignore errors here, it's used to display only info modal to user
        set(contactsPermissionResponseAtom, undefined)
        set(contactsAccessPrivilegesAtom, undefined)
        set(displayInfoAboutContactsAccessPrivilegesAtom, false)
      },
    })
  })

  const displayContactsCountAtom = atom((get) => !!get(searchTextAtom))

  const selectedNumbersAtom = atom(
    new Set(
      normalizedContacts
        .filter((one) => one.flags.imported || !one.flags.seen)
        .map((one) => one.computedValues.normalizedNumber)
    )
  )

  const areThereAnyContactsToDisplayForSelectedTabAtom = atom((get) => {
    const contactsToDisplay = get(_contactsToDisplayAtom)

    return contactsToDisplay.length !== 0
  })

  const selectAllAtom = atom(
    (get) => {
      const selectedNumbers = get(selectedNumbersAtom)
      const contactsToDisplay = get(_contactsToDisplayAtom)
      return !contactsToDisplay.some(
        (one) => !selectedNumbers.has(one.computedValues.normalizedNumber)
      )
    },
    (get, set, update: SetStateAction<boolean>) => {
      const contactsToDisplay = get(_contactsToDisplayAtom)
      const shouldSelectAll = getValueFromSetStateActionOfAtom(update)(() =>
        get(selectAllAtom)
      )

      set(selectedNumbersAtom, (value) => {
        const newValue = new Set<E164PhoneNumber>(value)
        contactsToDisplay
          .map((one) => one.computedValues.normalizedNumber)
          .forEach(shouldSelectAll ? newValue.add : newValue.delete, newValue)

        return newValue
      })
    }
  )

  const selectContactAtom = atomFamily((contactNumber: E164PhoneNumber) =>
    atom(
      (get) => get(selectedNumbersAtom).has(contactNumber),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
          get(selectedNumbersAtom).has(contactNumber)
        )

        set(selectedNumbersAtom, (value) => {
          const newValue = new Set(value)
          if (selected) newValue.add(contactNumber)
          else newValue.delete(contactNumber)
          return newValue
        })
      }
    )
  )

  const submitAllSelectedContactsActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const selectedNumbers = Array.fromIterable(get(selectedNumbersAtom))

      return Effect.gen(function* (_) {
        const result = yield* _(
          set(submitContactsActionAtom, {
            numbersToImport: selectedNumbers,
            normalizeAndImportAll: false,
            showOfferReencryptionDialog: selectedNumbers.length > 0,
          })
        )

        if (result) {
          set(toastNotificationAtom, t('contacts.contactsSubmitted'))
        }
        return result === 'success'
      })
    }
  )

  const importContactsFromPhoneActionAtom = atom(null, (get, set) => {
    return Effect.gen(function* (_) {
      set(loadingContactsFromDeviceAtom, true)

      const contactsLoaded = yield* _(
        set(loadContactsFromDeviceActionAtom).pipe(
          Effect.match({
            onFailure: () => false,
            onSuccess: () => true,
          })
        )
      )

      if (contactsLoaded) {
        yield* _(
          set(normalizeStoredContactsActionAtom, {
            onProgress: () => {},
          }).pipe(Effect.catchAll(() => Effect.void))
        )
        reloadContacts()
      }

      return contactsLoaded
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(loadingContactsFromDeviceAtom, false)
        })
      )
    )
  })

  const addNewContactActionAtom = atom(
    null,
    (
      get,
      set,
      params: {
        readonly contactName: string
        readonly phoneNumber: string
        readonly saveToPhone: boolean
      }
    ): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const normalizedNumber = toE164PhoneNumberWithDefaultCountryCode(
        params.phoneNumber
      )
      const contactName = params.contactName.trim()

      if (Option.isNone(normalizedNumber) || contactName.length === 0) {
        return Effect.succeed(false)
      }

      const existingContactWithNumber = pipe(
        get(storedContactsAtom),
        Array.findFirst(
          (contact) =>
            Option.isSome(contact.computedValues) &&
            contact.computedValues.value.normalizedNumber ===
              normalizedNumber.value
        )
      )

      if (Option.isSome(existingContactWithNumber)) {
        return pipe(
          set(globalDialogAtom, {
            title: t('addContactDialog.contactAlreadyAddedTitle'),
            subtitle: t('addContactDialog.contactAlreadyAddedDescription'),
            positiveButtonText: t('common.close'),
          }),
          Effect.as(false)
        )
      }

      return Effect.gen(function* (_) {
        const hash = yield* _(hashPhoneNumberE(normalizedNumber.value))
        const manualContact = Schema.decodeSync(
          StoredContactWithComputedValues
        )({
          info: {
            name: contactName,
            numberToDisplay: normalizedNumber.value,
            rawNumber: normalizedNumber.value,
          },
          computedValues: {
            hash,
            normalizedNumber: normalizedNumber.value,
          },
          flags: {
            seen: true,
            imported: false,
            importedManually: true,
            invalidNumber: 'valid',
          },
        })

        set(storedContactsAtom, (prev) => [
          ...pipe(
            prev,
            Array.filter(
              (contact) =>
                Option.isNone(contact.computedValues) ||
                contact.computedValues.value.normalizedNumber !==
                  manualContact.computedValues.normalizedNumber
            )
          ),
          {
            ...manualContact,
            computedValues: Option.some(manualContact.computedValues),
          },
        ])

        const contactsPermissionsGranted = params.saveToPhone
          ? yield* _(areContactsPermissionsGranted())
          : false

        if (params.saveToPhone && contactsPermissionsGranted) {
          yield* _(
            set(addContactToPhoneActionAtom, {
              customName: contactName,
              number: normalizedNumber.value,
            }),
            Effect.catchTag('ErrorAddingContactToPhoneContacts', (e) => {
              showErrorAlert({
                title: t('contacts.errorAddingContactToYourPhoneContacts'),
                error: e,
              })

              return Effect.succeed(false)
            })
          )
        }

        const submitContactsSuccess = yield* _(
          set(submitContactsActionAtom, {
            numbersToImport: deduplicate([
              ...Array.fromIterable(get(selectedNumbersAtom)),
              normalizedNumber.value,
            ]),
            normalizeAndImportAll: false,
            showOfferReencryptionDialog: false,
          })
        )

        set(searchTextAtom, '')
        reloadContacts()

        if (submitContactsSuccess) {
          if (params.saveToPhone && !contactsPermissionsGranted) {
            const shouldOpenSettings = yield* _(
              set(globalDialogAtom, {
                title: t('addContactDialog.contactAddedToVexlOnlyTitle'),
                subtitle: t(
                  'addContactDialog.contactAddedToVexlOnlyDescription'
                ),
                positiveButtonText: t('common.openSettings'),
                negativeButtonText: t('common.close'),
              })
            )

            if (shouldOpenSettings) {
              yield* _(
                Effect.sync(() => {
                  void Linking.openSettings()
                })
              )
            }
          } else {
            yield* _(
              set(globalDialogAtom, {
                title: t('addContactDialog.contactAddedSuccessTitle'),
                subtitle: t('addContactDialog.youCanEditThisContactAnytime'),
              })
            )
          }
        }

        return submitContactsSuccess === 'success'
      }).pipe(
        Effect.catchAll((e) => {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: e,
          })

          return Effect.succeed(false)
        })
      )
    }
  )

  const updateContactActionAtom = createUpdateContactActionAtom({
    reloadContacts,
    selectedNumbersAtom,
  })

  return {
    selectAllAtom,
    searchTextAtom,
    selectContactAtom,
    addNewContactSelectedCountryCodeAtom,
    addNewContactActionAtom,
    contactsFilterAtom,
    areThereAnyContactsToDisplayForSelectedTabAtom,
    selectedNumbersAtom,
    submitAllSelectedContactsActionAtom,
    importContactsFromPhoneActionAtom,
    normalizedContacts,
    nonSubmittedContactsToDisplayAtomsAtom,
    submittedContactsToDisplayAtomsAtom,
    newContactsToDisplayAtomsAtom,
    allContactsToDisplayAtomsAtom,
    newContactsToDisplayCountAtom,
    submittedContactsToDisplayCountAtom,
    nonSubmittedContactsToDisplayCountAtom,
    allContactsToDisplayCountAtom,
    displayContactsCountAtom,
    updateContactActionAtom,
    contactsAccessPrivilegesAtom,
    shouldOpenContactsSettingsAtom,
    checkContactsAccessPrivilegesActionAtom,
    displayInfoAboutContactsAccessPrivilegesAtom,
  }
})
