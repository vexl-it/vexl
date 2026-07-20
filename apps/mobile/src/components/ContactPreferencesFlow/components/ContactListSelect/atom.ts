import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {createScope, molecule} from 'bunshi/dist/react'
import {Array, Effect, Option, Schema, pipe} from 'effect'
import {
  getPermissionsAsync,
  type ContactsPermissionResponse,
} from 'expo-contacts'
import {atom, type Atom, type SetStateAction} from 'jotai'
import {atomFamily, splitAtom} from 'jotai/utils'
import {matchSorter, rankings} from 'match-sorter'
import {Linking} from 'react-native'
import {addContactToPhoneActionAtom} from '../../../../state/contacts/atom/addContactToPhoneWithUIFeedbackAtom'
import {CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS} from '../../../../state/contacts/atom/contactImportUtils'
import {
  normalizedContactsAtom,
  storedContactsAtom,
} from '../../../../state/contacts/atom/contactsStore'
import loadAndNormalizeContactsFromDeviceActionAtom from '../../../../state/contacts/atom/loadAndNormalizeContactsFromDeviceActionAtom'
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
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
import {createUpdateContactActionAtom} from './createUpdateContactActionAtom'

export const ContactsSelectScope = createScope<{
  reloadContacts: () => void
}>({
  reloadContacts: () => {},
})

const matchSorterKeys = ['info.name', 'info.numberToDisplay']
const matchSorterThreshold = rankings.CONTAINS

interface ContactsQuery {
  readonly contactsFilter: ContactsFilter
  readonly searchText: string
}

function isContactDefaultSelected(
  contact: StoredContactWithComputedValues
): boolean {
  return (
    contact.flags.imported ||
    !contact.flags.seen ||
    (contact.flags.importedManually && !contact.flags.imported)
  )
}

export const contactSelectMolecule = molecule((_, getScope) => {
  const {reloadContacts} = getScope(ContactsSelectScope)

  const addNewContactSelectedCountryCodeAtom = atom<string | undefined>(
    undefined
  )
  const searchTextAtom = atom('')
  const contactsFilterAtom = atom<ContactsFilter>('all')
  const requestedContactsFilterAtom = atom<ContactsFilter>('all')
  const requestedSearchTextAtom = atom('')
  const readyContactsQueryAtom = atom<ContactsQuery>({
    contactsFilter: 'all',
    searchText: '',
  })
  const isContactsPreparingAtom = atom((get) => {
    const readyContactsQuery = get(readyContactsQueryAtom)

    return (
      get(requestedContactsFilterAtom) !== readyContactsQuery.contactsFilter ||
      get(requestedSearchTextAtom) !== readyContactsQuery.searchText
    )
  })
  const resetContactsFilterFromRouteActionAtom = atom(
    null,
    (get, set, contactsFilter: ContactsFilter) => {
      const readyContactsQuery = get(readyContactsQueryAtom)

      set(requestedContactsFilterAtom, contactsFilter)
      set(contactsFilterAtom, contactsFilter)
      set(readyContactsQueryAtom, {
        ...readyContactsQuery,
        contactsFilter,
      })
    }
  )
  const createContactsToDisplayAtom = (
    shouldDisplayContact: (contact: StoredContactWithComputedValues) => boolean
  ): Atom<StoredContactWithComputedValues[]> =>
    atom((get) => {
      const searchText = get(searchTextAtom)
      // normalizedContactsAtom already guarantees uniqueness by
      // normalizedNumber, so no additional dedupe is needed here.
      const contactsToShow = pipe(
        get(normalizedContactsAtom),
        Array.filter(shouldDisplayContact)
      )

      return matchSorter(contactsToShow, searchText, {
        keys: matchSorterKeys,
        threshold: matchSorterThreshold,
      })
    })

  const newContactsToDisplayAtom = createContactsToDisplayAtom(
    (one) => !one.flags.seen
  )
  const submittedContactsToDisplayAtom = createContactsToDisplayAtom(
    (one) => one.flags.imported
  )
  const nonSubmittedContactsToDisplayAtom = createContactsToDisplayAtom(
    (one) => !one.flags.imported && one.flags.seen
  )
  const allContactsToDisplayAtom = createContactsToDisplayAtom(() => true)

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
  const contactsToDisplayAtomsAtom = atom((get) => {
    const contactsFilter = get(contactsFilterAtom)

    return get(
      contactsFilter === 'submitted'
        ? submittedContactsToDisplayAtomsAtom
        : contactsFilter === 'nonSubmitted'
          ? nonSubmittedContactsToDisplayAtomsAtom
          : contactsFilter === 'new'
            ? newContactsToDisplayAtomsAtom
            : allContactsToDisplayAtomsAtom
    )
  })

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
  const contactsToDisplayCountAtom = atom(
    (get) => get(contactsToDisplayAtomsAtom).length
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
    return Effect.promise(async () => {
      try {
        const contactsPermissions = await getPermissionsAsync()
        set(contactsPermissionResponseAtom, contactsPermissions)
        set(contactsAccessPrivilegesAtom, contactsPermissions.accessPrivileges)
        set(
          displayInfoAboutContactsAccessPrivilegesAtom,
          contactsPermissions.accessPrivileges === 'limited'
        )
      } catch {
        // ignore errors here, it's used to display only info modal to user
        set(contactsPermissionResponseAtom, undefined)
        set(contactsAccessPrivilegesAtom, undefined)
        set(displayInfoAboutContactsAccessPrivilegesAtom, false)
      }
    })
  })

  const displayContactsCountAtom = atom((get) => !!get(searchTextAtom))

  const defaultSelectedNumbersAtom = atom(
    (get) =>
      new Set(
        pipe(
          get(normalizedContactsAtom),
          Array.filter(isContactDefaultSelected),
          Array.map((one) => one.computedValues.normalizedNumber)
        )
      )
  )
  const selectedNumbersStateAtom = atom<Set<E164PhoneNumber> | undefined>(
    undefined
  )
  const selectedNumbersAtom = atom(
    (get) => get(selectedNumbersStateAtom) ?? get(defaultSelectedNumbersAtom),
    (get, set, value: SetStateAction<Set<E164PhoneNumber>>): void => {
      set(
        selectedNumbersStateAtom,
        getValueFromSetStateActionOfAtom(value)(() => get(selectedNumbersAtom))
      )
    }
  )
  // Large contact sets are processed in chunks behind the stepped progress
  // dialog instead of the static "preparing" overlay. Single source of truth
  // shared by the submit action and the screen (to suppress its overlay).
  const shouldShowContactImportProgressDialogAtom = atom(
    (get) =>
      get(selectedNumbersAtom).size >=
        CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS ||
      get(normalizedContactsAtom).length >=
        CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS
  )
  const knownContactNumbersAtom = atom(new Set<E164PhoneNumber>())
  const syncDefaultSelectedContactsActionAtom = atom(null, (get, set) => {
    if (get(selectedNumbersStateAtom) === undefined) {
      set(selectedNumbersStateAtom, get(defaultSelectedNumbersAtom))
    }

    const latestNormalizedContacts = get(normalizedContactsAtom)
    const knownContactNumbers = get(knownContactNumbersAtom)
    const currentContactNumbers = new Set(
      pipe(
        latestNormalizedContacts,
        Array.map((one) => one.computedValues.normalizedNumber)
      )
    )
    const newDefaultSelectedNumbers = pipe(
      latestNormalizedContacts,
      Array.filter(
        (one) =>
          isContactDefaultSelected(one) &&
          !knownContactNumbers.has(one.computedValues.normalizedNumber)
      ),
      Array.map((one) => one.computedValues.normalizedNumber)
    )

    if (newDefaultSelectedNumbers.length > 0) {
      set(selectedNumbersAtom, (selectedNumbers) => {
        const nextSelectedNumbers = new Set(selectedNumbers)
        pipe(
          newDefaultSelectedNumbers,
          Array.forEach((number) => {
            nextSelectedNumbers.add(number)
          })
        )
        return nextSelectedNumbers
      })
    }

    set(knownContactNumbersAtom, currentContactNumbers)
  })
  const areThereAnyContactsToDisplayForSelectedTabAtom = atom((get) => {
    const contactsToDisplay = get(_contactsToDisplayAtom)

    return contactsToDisplay.length !== 0
  })
  const areThereAnySelectedContactsAtom = atom(
    (get) => get(selectedNumbersAtom).size > 0
  )

  const areAllContactsToDisplaySelectedAtom = atom((get) => {
    const contactsToDisplay = get(_contactsToDisplayAtom)
    const selectedNumbers = get(selectedNumbersAtom)

    return (
      Array.isNonEmptyArray(contactsToDisplay) &&
      pipe(
        contactsToDisplay,
        Array.every((one) =>
          selectedNumbers.has(one.computedValues.normalizedNumber)
        )
      )
    )
  })

  const toggleAllContactsToDisplayActionAtom = atom(null, (get, set) => {
    const contactsToDisplay = get(_contactsToDisplayAtom)
    const shouldSelectAll = !get(areAllContactsToDisplaySelectedAtom)

    set(selectedNumbersAtom, (value) => {
      const newValue = new Set<E164PhoneNumber>(value)
      pipe(
        contactsToDisplay,
        Array.map((one) => one.computedValues.normalizedNumber),
        Array.forEach((number) => {
          if (shouldSelectAll) newValue.add(number)
          else newValue.delete(number)
        })
      )

      return newValue
    })
  })

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
      const showContactImportProgressDialog = get(
        shouldShowContactImportProgressDialogAtom
      )

      return Effect.gen(function* (_) {
        const result = yield* _(
          set(submitContactsActionAtom, {
            numbersToImport: selectedNumbers,
            normalizeAndImportAll: false,
            showOfferReencryptionDialog: selectedNumbers.length > 0,
            manageLoadingOverlay: false,
            showContactImportProgressDialog,
          })
        )

        if (result === 'success') {
          set(toastNotificationAtom, t('contacts.contactsSubmitted'))
        }
        return result === 'success'
      })
    }
  )

  const importContactsFromPhoneActionAtom = atom(null, (get, set) => {
    return set(loadAndNormalizeContactsFromDeviceActionAtom).pipe(
      Effect.tap((contactsLoaded) =>
        Effect.sync(() => {
          if (contactsLoaded) reloadContacts()
        })
      ),
      Effect.catchAll(() => Effect.succeed(false)),
      Effect.ensuring(set(checkContactsAccessPrivilegesActionAtom))
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

        const contactsPermissionsGranted = params.saveToPhone
          ? yield* _(areContactsPermissionsGranted())
          : false

        const addContactToPhoneSuccess =
          params.saveToPhone && contactsPermissionsGranted
            ? yield* _(
                set(addContactToPhoneActionAtom, {
                  customName: contactName,
                  number: normalizedNumber.value,
                }),
                Effect.catchTag('ErrorAddingContactToPhoneContacts', () =>
                  pipe(
                    set(globalDialogAtom, {
                      title: t(
                        'contacts.errorAddingContactToYourPhoneContacts'
                      ),
                      subtitle: t(
                        'addContactDialog.contactCouldNotBeSavedToPhoneDescription'
                      ),
                      positiveButtonText: t('common.close'),
                    }),
                    Effect.as(false)
                  )
                )
              )
            : false

        if (
          params.saveToPhone &&
          contactsPermissionsGranted &&
          !addContactToPhoneSuccess
        ) {
          return false
        }

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
        set(selectedNumbersAtom, (selectedNumbers) => {
          const nextSelectedNumbers = new Set(selectedNumbers)
          nextSelectedNumbers.add(normalizedNumber.value)
          return nextSelectedNumbers
        })

        set(searchTextAtom, '')
        reloadContacts()

        if (params.saveToPhone && !contactsPermissionsGranted) {
          const shouldOpenSettings = yield* _(
            set(globalDialogAtom, {
              title: t('addContactDialog.contactAddedToVexlOnlyTitle'),
              subtitle: t('addContactDialog.contactAddedToVexlOnlyDescription'),
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

        return true
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
    areAllContactsToDisplaySelectedAtom,
    toggleAllContactsToDisplayActionAtom,
    searchTextAtom,
    requestedContactsFilterAtom,
    requestedSearchTextAtom,
    readyContactsQueryAtom,
    isContactsPreparingAtom,
    resetContactsFilterFromRouteActionAtom,
    selectContactAtom,
    addNewContactSelectedCountryCodeAtom,
    addNewContactActionAtom,
    contactsFilterAtom,
    areThereAnyContactsToDisplayForSelectedTabAtom,
    areThereAnySelectedContactsAtom,
    selectedNumbersAtom,
    shouldShowContactImportProgressDialogAtom,
    syncDefaultSelectedContactsActionAtom,
    submitAllSelectedContactsActionAtom,
    importContactsFromPhoneActionAtom,
    normalizedContactsAtom,
    nonSubmittedContactsToDisplayAtomsAtom,
    submittedContactsToDisplayAtomsAtom,
    newContactsToDisplayAtomsAtom,
    allContactsToDisplayAtomsAtom,
    contactsToDisplayAtomsAtom,
    contactsToDisplayCountAtom,
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
