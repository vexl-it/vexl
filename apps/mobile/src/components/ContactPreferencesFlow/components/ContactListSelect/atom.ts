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
import {
  CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS,
  CONTACT_NORMALIZATION_CHUNK_SIZE,
} from '../../../../state/contacts/atom/contactImportUtils'
import {
  normalizedContactsAtom,
  storedContactsAtom,
} from '../../../../state/contacts/atom/contactsStore'
import loadAndNormalizeContactsFromDeviceActionAtom from '../../../../state/contacts/atom/loadAndNormalizeContactsFromDeviceActionAtom'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {
  generateManualContactId,
  toStoredContact,
  type ContactKind,
  type ContactsFilter,
  type NonUniqueContactId,
  type NormalizedContactValue,
  type StoredContact,
  type StoredContactWithComputedValues,
} from '../../../../state/contacts/domain'
import {createManualContact} from '../../../../state/contacts/manualContact'
import {
  areContactsPermissionsAlreadyGranted,
  areContactsPermissionsGranted,
  normalizeContactValue,
} from '../../../../state/contacts/utils'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {
  runAfterTwoAnimationFrames,
  waitForNextAnimationFrameEffect,
} from '../../../../utils/runAfterAnimationFrames'
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

// Raw values included so contacts whose normalization is still pending
// are matched too (their computedValues are None)
function collectStoredContactValues(
  contacts: readonly StoredContact[]
): Set<string> {
  const values = new Set<string>()
  pipe(
    contacts,
    Array.forEach((contact) => {
      values.add(contact.info.rawValue)
      if (Option.isSome(contact.computedValues))
        values.add(contact.computedValues.value.normalizedValue)
    })
  )
  return values
}

const matchSorterKeys = ['info.name', 'info.rawValue']
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

  const defaultSelectedValuesAtom = atom(
    (get) =>
      new Set(
        pipe(
          get(normalizedContactsAtom),
          Array.filter(isContactDefaultSelected),
          Array.map((one) => one.computedValues.normalizedValue)
        )
      )
  )
  const selectedValuesStateAtom = atom<Set<NormalizedContactValue> | undefined>(
    undefined
  )
  const selectedValuesAtom = atom(
    (get) => get(selectedValuesStateAtom) ?? get(defaultSelectedValuesAtom),
    (get, set, value: SetStateAction<Set<NormalizedContactValue>>): void => {
      set(
        selectedValuesStateAtom,
        getValueFromSetStateActionOfAtom(value)(() => get(selectedValuesAtom))
      )
    }
  )
  // Large contact sets are processed in chunks behind the stepped progress
  // dialog instead of the static "preparing" overlay. Single source of truth
  // shared by the submit action and the screen (to suppress its overlay).
  const shouldShowContactImportProgressDialogAtom = atom(
    (get) =>
      get(selectedValuesAtom).size >=
        CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS ||
      get(normalizedContactsAtom).length >=
        CONTACT_IMPORT_PROGRESS_DIALOG_MIN_CONTACTS
  )
  const knownContactValuesAtom = atom(new Set<NormalizedContactValue>())
  const syncDefaultSelectedContactsActionAtom = atom(null, (get, set) => {
    if (get(selectedValuesStateAtom) === undefined) {
      set(selectedValuesStateAtom, get(defaultSelectedValuesAtom))
    }

    const latestNormalizedContacts = get(normalizedContactsAtom)
    const knownContactValues = get(knownContactValuesAtom)
    const currentContactValues = new Set(
      pipe(
        latestNormalizedContacts,
        Array.map((one) => one.computedValues.normalizedValue)
      )
    )
    const newDefaultSelectedValues = pipe(
      latestNormalizedContacts,
      Array.filter(
        (one) =>
          isContactDefaultSelected(one) &&
          !knownContactValues.has(one.computedValues.normalizedValue)
      ),
      Array.map((one) => one.computedValues.normalizedValue)
    )

    if (newDefaultSelectedValues.length > 0) {
      set(selectedValuesAtom, (selectedValues) => {
        const nextSelectedValues = new Set(selectedValues)
        pipe(
          newDefaultSelectedValues,
          Array.forEach((value) => {
            nextSelectedValues.add(value)
          })
        )
        return nextSelectedValues
      })
    }

    set(knownContactValuesAtom, currentContactValues)
  })
  const areThereAnyContactsToDisplayForSelectedTabAtom = atom((get) => {
    const contactsToDisplay = get(_contactsToDisplayAtom)

    return contactsToDisplay.length !== 0
  })
  const areThereAnySelectedContactsAtom = atom(
    (get) => get(selectedValuesAtom).size > 0
  )

  const areAllContactsToDisplaySelectedAtom = atom((get) => {
    const contactsToDisplay = get(_contactsToDisplayAtom)
    const selectedValues = get(selectedValuesAtom)

    return (
      Array.isNonEmptyArray(contactsToDisplay) &&
      pipe(
        contactsToDisplay,
        Array.every((contact) =>
          selectedValues.has(contact.computedValues.normalizedValue)
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
      set(selectedValuesAtom, (value) => {
        const newValue = new Set<NormalizedContactValue>(value)
        pipe(
          contactsToDisplay,
          Array.forEach((contact) => {
            const value = contact.computedValues.normalizedValue
            if (shouldSelectAll) newValue.add(value)
            else newValue.delete(value)
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

  const selectContactAtom = atomFamily((contactValue: NormalizedContactValue) =>
    atom(
      (get) => get(selectedValuesAtom).has(contactValue),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
          get(selectedValuesAtom).has(contactValue)
        )

        set(selectedValuesAtom, (value) => {
          const newValue = new Set(value)
          if (selected) newValue.add(contactValue)
          else newValue.delete(contactValue)
          return newValue
        })
      }
    )
  )

  const submitAllSelectedContactsActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const selectedValues = Array.fromIterable(get(selectedValuesAtom))
      const showContactImportProgressDialog = get(
        shouldShowContactImportProgressDialogAtom
      )

      return Effect.gen(function* (_) {
        const result = yield* _(
          set(submitContactsActionAtom, {
            valuesToImport: selectedValues,
            normalizeAndImportAll: false,
            showOfferReencryptionDialog: selectedValues.length > 0,
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

  const importContactsFromPhoneActionAtom = atom(
    null,
    (
      get,
      set,
      params: {
        /**
         * Only user-initiated imports may show the OS permission prompt.
         * Automatic runs (screen focus, app resume) must stay silent, otherwise
         * a user who denied once would be prompted again on every focus/resume.
         */
        readonly requestPermissions: boolean
      }
    ): Effect.Effect<boolean> =>
      Effect.gen(function* (_) {
        if (!params.requestPermissions) {
          const permissionsAlreadyGranted = yield* _(
            areContactsPermissionsAlreadyGranted()
          )
          if (!permissionsAlreadyGranted) return false
        }

        return yield* _(set(loadAndNormalizeContactsFromDeviceActionAtom))
      }).pipe(
        Effect.tap((contactsLoaded) =>
          Effect.sync(() => {
            if (contactsLoaded) reloadContacts()
          })
        ),
        Effect.catchAll(() => Effect.succeed(false)),
        Effect.ensuring(set(checkContactsAccessPrivilegesActionAtom))
      )
  )

  const addNewContactActionAtom = atom(
    null,
    (
      get,
      set,
      params: {
        readonly contactName: string
        readonly phoneNumber: string
        readonly email: string
        readonly saveToPhone: boolean
      }
    ): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const contactName = params.contactName.trim()
      const phoneNumber =
        params.phoneNumber.trim().length > 0
          ? normalizeContactValue('phone', params.phoneNumber)
          : Option.none()
      const email =
        params.email.trim().length > 0
          ? normalizeContactValue('email', params.email)
          : Option.none()
      const someInputInvalid =
        (params.phoneNumber.trim().length > 0 && Option.isNone(phoneNumber)) ||
        (params.email.trim().length > 0 && Option.isNone(email))
      const valuesToAdd = pipe(
        [
          Option.map(phoneNumber, (normalizedValue) => ({
            kind: 'phone' as const,
            normalizedValue,
          })),
          Option.map(email, (normalizedValue) => ({
            kind: 'email' as const,
            normalizedValue,
          })),
        ],
        Array.getSomes
      )

      if (
        contactName.length === 0 ||
        someInputInvalid ||
        !Array.isNonEmptyArray(valuesToAdd)
      ) {
        return Effect.succeed(false)
      }

      const storedContactValues = collectStoredContactValues(
        get(storedContactsAtom)
      )
      const someValueAlreadyStored = pipe(
        valuesToAdd,
        Array.some((one) => storedContactValues.has(one.normalizedValue))
      )

      if (someValueAlreadyStored) {
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
        const contactId = generateManualContactId()
        const manualContacts = yield* _(
          Effect.forEach(valuesToAdd, ({kind, normalizedValue}) =>
            createManualContact({
              kind,
              name: contactName,
              normalizedValue,
              contactId,
              seen: true,
            })
          )
        )

        const contactsPermissionsGranted = params.saveToPhone
          ? yield* _(areContactsPermissionsGranted())
          : false

        const addContactToPhoneSuccess =
          params.saveToPhone && contactsPermissionsGranted
            ? yield* _(
                set(addContactToPhoneActionAtom, {
                  customName: contactName,
                  phoneNumber: Option.getOrUndefined(phoneNumber),
                  email: Option.getOrUndefined(email),
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
          ...prev,
          ...Array.map(manualContacts, toStoredContact),
        ])
        set(selectedValuesAtom, (selectedValues) => {
          const nextSelectedValues = new Set(selectedValues)
          pipe(
            manualContacts,
            Array.forEach((one) => {
              nextSelectedValues.add(one.computedValues.normalizedValue)
            })
          )
          return nextSelectedValues
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

        // Values of one card share a contact id so they stay paired
        const entries = pipe(
          parsedContacts,
          Array.flatMap(({name, phoneNumbers, emails}) => {
            const contactId = generateManualContactId()
            const toEntry = (kind: ContactKind) => (rawValue: string) => ({
              name,
              contactId,
              kind,
              rawValue,
            })
            return [
              ...Array.map(phoneNumbers, toEntry('phone')),
              ...Array.map(emails, toEntry('email')),
            ]
          })
        )
        const existingContactValues = collectStoredContactValues(
          get(storedContactsAtom)
        )
        const seenValues = new Set<NormalizedContactValue>()
        let skippedCount = 0
        let processedEntriesCount = 0
        let reachedContactLimit = false
        const contactsToImport: Array<{
          name: string
          contactId: NonUniqueContactId
          kind: ContactKind
          normalizedValue: NormalizedContactValue
        }> = []

        for (const entriesChunk of pipe(
          entries,
          Array.chunksOf(CONTACT_NORMALIZATION_CHUNK_SIZE)
        )) {
          yield* _(waitForNextAnimationFrameEffect())
          for (const {name, contactId, kind, rawValue} of entriesChunk) {
            if (contactsToImport.length >= MAX_CONTACTS_PER_VCF_IMPORT) {
              skippedCount += entries.length - processedEntriesCount
              reachedContactLimit = true
              break
            }
            processedEntriesCount++

            // Match on the raw string too - a stored contact pending
            // normalization is only known by its raw value
            if (existingContactValues.has(rawValue)) {
              skippedCount++
              continue
            }

            const normalizedValue = normalizeContactValue(kind, rawValue)
            if (Option.isNone(normalizedValue)) {
              skippedCount++
              continue
            }
            if (seenValues.has(normalizedValue.value)) continue
            seenValues.add(normalizedValue.value)
            if (existingContactValues.has(normalizedValue.value)) {
              skippedCount++
              continue
            }
            contactsToImport.push({
              name,
              contactId,
              kind,
              normalizedValue: normalizedValue.value,
            })
          }
          if (reachedContactLimit) break
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
          Effect.forEach(
            Array.chunksOf(contactsToImport, CONTACT_NORMALIZATION_CHUNK_SIZE),
            (contactsToImportChunk) =>
              waitForNextAnimationFrameEffect().pipe(
                Effect.zipRight(
                  Effect.forEach(contactsToImportChunk, (contactToImport) =>
                    // seen: false so restored contacts surface on the "New"
                    // tab (they get resolved as seen when the list screen
                    // unmounts)
                    createManualContact({...contactToImport, seen: false})
                  )
                )
              )
          ),
          Effect.map(Array.flatten)
        )

        // The confirmation dialog can stay open indefinitely - drop entries
        // that another flow (e.g. background contact sync) stored meanwhile
        const currentContactValues = collectStoredContactValues(
          get(storedContactsAtom)
        )
        const contactsToStore = pipe(
          newStoredContacts,
          Array.filter(
            (one) =>
              !currentContactValues.has(one.computedValues.normalizedValue)
          )
        )

        set(storedContactsAtom, (prev) => [
          ...prev,
          ...Array.map(contactsToStore, toStoredContact),
        ])
        set(selectedValuesAtom, (selectedValues) => {
          const nextSelectedValues = new Set(selectedValues)
          pipe(
            contactsToStore,
            Array.forEach((one) => {
              nextSelectedValues.add(one.computedValues.normalizedValue)
            })
          )
          return nextSelectedValues
        })
        reloadContacts()

        set(
          toastNotificationAtom,
          t('contactPreferences.importVcf.success', {
            count: contactsToStore.length,
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
    selectedValuesAtom,
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
    selectedValuesAtom,
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
