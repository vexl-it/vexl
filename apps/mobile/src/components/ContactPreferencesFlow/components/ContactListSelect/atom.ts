import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {createScope, molecule} from 'bunshi/dist/react'
import {Array, Effect, Option, Schema, pipe} from 'effect'
import {
  getPermissionsAsync,
  type ContactsPermissionResponse,
} from 'expo-contacts'
import {getDocumentAsync} from 'expo-document-picker'
import {File} from 'expo-file-system'
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
import {runAfterTwoAnimationFrames} from '../../../../utils/runAfterAnimationFrames'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {parseVcardString} from '../../../../utils/vCard'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
import {createUpdateContactActionAtom} from './createUpdateContactActionAtom'

export const ContactsSelectScope = createScope<{
  reloadContacts: () => void
}>({
  reloadContacts: () => {},
})

class ContactsImportError extends Schema.TaggedError<ContactsImportError>(
  'ContactsImportError'
)('ContactsImportError', {
  cause: Schema.Unknown,
}) {}

// Hard caps for untrusted .vcf input
const MAX_VCF_FILE_SIZE_BYTES = 2 * 1024 * 1024
const MAX_CONTACTS_PER_VCF_IMPORT = 5000

const matchSorterKeys = ['info.name', 'info.numberToDisplay']
const matchSorterThreshold = rankings.CONTAINS

interface ContactsQuery {
  readonly contactsFilter: ContactsFilter
  readonly searchText: string
}

function isContactDefaultSelected(
  contact: StoredContactWithComputedValues
): boolean {
  return contact.flags.imported || !contact.flags.seen
}

function isNewContact(contact: StoredContactWithComputedValues): boolean {
  return !contact.flags.seen
}

function isSubmittedContact(contact: StoredContactWithComputedValues): boolean {
  return contact.flags.imported
}

function isNonSubmittedContact(
  contact: StoredContactWithComputedValues
): boolean {
  return !contact.flags.imported && contact.flags.seen
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
  const isContactsSearchPreparingAtom = atom((get) => {
    return (
      get(requestedSearchTextAtom) !== get(readyContactsQueryAtom).searchText
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
  const searchedContactsToDisplayAtom = atom((get) => {
    const searchText = get(searchTextAtom)

    return matchSorter(get(normalizedContactsAtom), searchText, {
      keys: matchSorterKeys,
      threshold: matchSorterThreshold,
    })
  })
  const createFilteredContactsToDisplayAtom = (
    shouldDisplayContact: (contact: StoredContactWithComputedValues) => boolean
  ): Atom<StoredContactWithComputedValues[]> =>
    atom((get) =>
      pipe(
        get(searchedContactsToDisplayAtom),
        Array.filter(shouldDisplayContact)
      )
    )

  const newContactsToDisplayAtom =
    createFilteredContactsToDisplayAtom(isNewContact)
  const submittedContactsToDisplayAtom =
    createFilteredContactsToDisplayAtom(isSubmittedContact)
  const nonSubmittedContactsToDisplayAtom = createFilteredContactsToDisplayAtom(
    isNonSubmittedContact
  )
  const allContactsToDisplayAtom = searchedContactsToDisplayAtom

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

  const allContactsToDisplayAtomsAtom = splitAtom(allContactsToDisplayAtom)
  const createFilteredContactAtomsAtom = (
    shouldDisplayContact: (contact: StoredContactWithComputedValues) => boolean
  ): Atom<ReadonlyArray<Atom<StoredContactWithComputedValues>>> =>
    atom((get) =>
      pipe(
        get(allContactsToDisplayAtomsAtom),
        Array.filter((contactAtom) => shouldDisplayContact(get(contactAtom)))
      )
    )
  const newContactsToDisplayAtomsAtom =
    createFilteredContactAtomsAtom(isNewContact)
  const submittedContactsToDisplayAtomsAtom =
    createFilteredContactAtomsAtom(isSubmittedContact)
  const nonSubmittedContactsToDisplayAtomsAtom = createFilteredContactAtomsAtom(
    isNonSubmittedContact
  )
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
        Array.every((contact) =>
          selectedNumbers.has(contact.computedValues.normalizedNumber)
        )
      )
    )
  })

  const isBulkSelectionPreparingAtom = atom(false)
  const toggleAllContactsToDisplayActionAtom = atom(null, (get, set) => {
    if (get(isBulkSelectionPreparingAtom)) return undefined

    const contactsToDisplay = get(_contactsToDisplayAtom)
    const shouldSelectAll = !get(areAllContactsToDisplaySelectedAtom)
    set(isBulkSelectionPreparingAtom, true)

    let cancelScheduledWork = runAfterTwoAnimationFrames(() => {
      set(selectedNumbersAtom, (value) => {
        const newValue = new Set<E164PhoneNumber>(value)
        pipe(
          contactsToDisplay,
          Array.forEach((contact) => {
            const number = contact.computedValues.normalizedNumber
            if (shouldSelectAll) newValue.add(number)
            else newValue.delete(number)
          })
        )

        return newValue
      })

      cancelScheduledWork = runAfterTwoAnimationFrames(() => {
        set(isBulkSelectionPreparingAtom, false)
      })
    })

    return () => {
      cancelScheduledWork()
      set(isBulkSelectionPreparingAtom, false)
    }
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

  const importVexlOnlyContactsActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)

      return Effect.gen(function* (_) {
        const pickerResult = yield* _(
          Effect.tryPromise({
            try: async () =>
              await getDocumentAsync({
                type: ['text/vcard', 'text/x-vcard'],
                copyToCacheDirectory: true,
                multiple: false,
              }),
            catch: (e) => new ContactsImportError({cause: e}),
          })
        )

        if (pickerResult.canceled) return false
        const pickedAsset = pickerResult.assets[0]
        if (pickedAsset === undefined) return false

        const vcardString = yield* _(
          Effect.tryPromise({
            try: async () => {
              const pickedFile = new File(pickedAsset.uri)
              try {
                if (pickedFile.size > MAX_VCF_FILE_SIZE_BYTES) return undefined
                return await pickedFile.text()
              } finally {
                // remove the cache copy created by the document picker
                if (pickedFile.info().exists) pickedFile.delete()
              }
            },
            catch: (e) => new ContactsImportError({cause: e}),
          })
        )

        if (vcardString === undefined) {
          yield* _(
            set(globalDialogAtom, {
              title: t('contactPreferences.importVcf.invalidFileTitle'),
              subtitle: t(
                'contactPreferences.importVcf.fileTooLargeDescription'
              ),
              positiveButtonText: t('common.close'),
            })
          )
          return false
        }

        const parsedContacts = parseVcardString(vcardString)

        if (!Array.isNonEmptyArray(parsedContacts)) {
          yield* _(
            set(globalDialogAtom, {
              title: t('contactPreferences.importVcf.noContactsFoundTitle'),
              subtitle: t(
                'contactPreferences.importVcf.noContactsFoundDescription'
              ),
              positiveButtonText: t('common.close'),
            })
          )
          return false
        }

        const existingNormalizedNumbers = new Set(
          pipe(
            get(normalizedContactsAtom),
            Array.map((one) => one.computedValues.normalizedNumber)
          )
        )
        const seenNumbers = new Set<E164PhoneNumber>()
        let skippedCount = 0
        const contactsToImport: Array<{
          name: string
          normalizedNumber: E164PhoneNumber
        }> = []

        for (const parsedContact of parsedContacts) {
          for (const phoneNumber of parsedContact.phoneNumbers) {
            const normalizedNumber =
              toE164PhoneNumberWithDefaultCountryCode(phoneNumber)
            if (Option.isNone(normalizedNumber)) {
              skippedCount++
              continue
            }
            if (seenNumbers.has(normalizedNumber.value)) continue
            seenNumbers.add(normalizedNumber.value)
            if (existingNormalizedNumbers.has(normalizedNumber.value)) {
              skippedCount++
              continue
            }
            if (contactsToImport.length >= MAX_CONTACTS_PER_VCF_IMPORT) {
              skippedCount++
              continue
            }
            contactsToImport.push({
              name: parsedContact.name,
              normalizedNumber: normalizedNumber.value,
            })
          }
        }

        if (!Array.isNonEmptyArray(contactsToImport)) {
          yield* _(
            set(globalDialogAtom, {
              title: t('contactPreferences.importVcf.nothingNewTitle'),
              subtitle: t('contactPreferences.importVcf.nothingNewDescription'),
              positiveButtonText: t('common.close'),
            })
          )
          return false
        }

        const importConfirmed = yield* _(
          set(globalDialogAtom, {
            title: t('contactPreferences.importVcf.confirmTitle', {
              count: contactsToImport.length,
            }),
            subtitle:
              skippedCount > 0
                ? t('contactPreferences.importVcf.confirmDescriptionSkipped', {
                    count: skippedCount,
                  })
                : t('contactPreferences.importVcf.confirmDescription'),
            positiveButtonText: t('contactPreferences.importVcf.confirmButton'),
            negativeButtonText: t('common.cancel'),
          })
        )
        if (!importConfirmed) return false

        const newStoredContacts = yield* _(
          Effect.forEach(contactsToImport, ({name, normalizedNumber}) =>
            hashPhoneNumberE(normalizedNumber).pipe(
              Effect.map((hash) =>
                Schema.decodeSync(StoredContactWithComputedValues)({
                  info: {
                    name,
                    numberToDisplay: normalizedNumber,
                    rawNumber: normalizedNumber,
                  },
                  computedValues: {
                    hash,
                    normalizedNumber,
                  },
                  // seen: false so restored contacts surface on the "New" tab
                  // (they get resolved as seen when the list screen unmounts)
                  flags: {
                    seen: false,
                    imported: false,
                    importedManually: true,
                    invalidNumber: 'valid',
                  },
                })
              )
            )
          )
        )

        set(storedContactsAtom, (prev) => [
          ...prev,
          ...pipe(
            newStoredContacts,
            Array.map((one) => ({
              ...one,
              computedValues: Option.some(one.computedValues),
            }))
          ),
        ])
        set(selectedNumbersAtom, (selectedNumbers) => {
          const nextSelectedNumbers = new Set(selectedNumbers)
          pipe(
            contactsToImport,
            Array.forEach(({normalizedNumber}) => {
              nextSelectedNumbers.add(normalizedNumber)
            })
          )
          return nextSelectedNumbers
        })
        reloadContacts()

        set(
          toastNotificationAtom,
          t('contactPreferences.importVcf.success', {
            count: contactsToImport.length,
          })
        )

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
    isBulkSelectionPreparingAtom,
    toggleAllContactsToDisplayActionAtom,
    searchTextAtom,
    requestedContactsFilterAtom,
    requestedSearchTextAtom,
    readyContactsQueryAtom,
    isContactsPreparingAtom,
    isContactsSearchPreparingAtom,
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
    importVexlOnlyContactsActionAtom,
    displayContactsCountAtom,
    updateContactActionAtom,
    contactsAccessPrivilegesAtom,
    shouldOpenContactsSettingsAtom,
    checkContactsAccessPrivilegesActionAtom,
    displayInfoAboutContactsAccessPrivilegesAtom,
  }
})
