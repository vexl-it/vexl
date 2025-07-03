import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {createScope, molecule} from 'bunshi/dist/react'
import {Array, Effect, Option, Schema, pipe} from 'effect'
import {atom, type Atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {matchSorter, rankings} from 'match-sorter'
import {addContactToPhoneWithUIFeedbackActionAtom} from '../../../../state/contacts/atom/addContactToPhoneWithUIFeedbackAtom'
import {storedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {
  StoredContactWithComputedValuesE,
  type ContactsFilter,
  type StoredContactWithComputedValues,
} from '../../../../state/contacts/domain'
import {
  areContactsPermissionsGranted,
  hashPhoneNumberE,
} from '../../../../state/contacts/utils'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import deduplicate, {deduplicateBy} from '../../../../utils/deduplicate'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {showErrorAlertE} from '../../../../utils/showErrorAlert'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
import checkIconSvg from '../../../images/checkIconSvg'
import userSvg from '../../../images/userSvg'

export const ContactsSelectScope = createScope<{
  normalizedContacts: StoredContactWithComputedValues[]
  reloadContacts: () => void
}>({
  reloadContacts: () => {},
  normalizedContacts: [],
})

const matchSorterKeys = ['info.name', 'info.numberToDisplay']
const matchSorterThreshold = rankings.CONTAINS

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

  function createIsNewContactAtom(
    contactAtom: Atom<StoredContactWithComputedValues>
  ): Atom<boolean> {
    return atom((get) => !get(contactAtom).flags.seen)
  }

  function createSelectContactAtom(
    contactAtom: Atom<StoredContactWithComputedValues>
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) =>
        get(selectedNumbersAtom).has(
          get(contactAtom).computedValues.normalizedNumber
        ),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const contactNumber = get(contactAtom).computedValues.normalizedNumber
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
  }

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
          set(toastNotificationAtom, {
            visible: true,
            text: t('contacts.contactsSubmitted'),
            icon: checkIconSvg,
            hideAfterMillis: 2000,
          })
        }
        return result === 'success'
      })
    }
  )

  const searchTextAsCustomContactAtom = atom((get) => {
    const searchText = get(searchTextAtom)
    const number = toE164PhoneNumberWithDefaultCountryCode(searchText)

    if (Option.isNone(number)) return Option.none()

    const hash = Effect.runSync(
      hashPhoneNumberE(number.value).pipe(
        Effect.match({
          onSuccess(value) {
            return Option.some(value)
          },
          onFailure() {
            return Option.none()
          },
        })
      )
    )

    if (Option.isNone(hash)) return Option.none()

    return Option.some(
      Schema.decodeSync(StoredContactWithComputedValuesE)({
        info: {
          name: searchText,
          numberToDisplay: searchText,
          rawNumber: searchText,
        },
        computedValues: {
          hash: hash.value,
          normalizedNumber: number.value,
        },
        flags: {
          seen: true,
          imported: false,
          importedManually: true,
          invalidNumber: 'valid',
        },
      })
    )
  })

  const addAndSelectContactWithUiFeedbackAtom = atom(
    null,
    (get, set, contact: StoredContactWithComputedValues) => {
      const {t} = get(translationAtom)

      return Effect.gen(function* (_) {
        const result = yield* _(
          set(askAreYouSureActionAtom, {
            variant: 'info',
            steps: [
              {
                title: t('addContactDialog.addContact'),
                description: t('addContactDialog.addThisPhoneNumber'),
                subtitle: contact.computedValues.normalizedNumber,
                negativeButtonText: t('common.notNow'),
                positiveButtonText: t('addContactDialog.addContact'),
                type: 'StepWithInput',
                textInputProps: {
                  autoFocus: true,
                  autoCorrect: false,
                  placeholder: t('addContactDialog.addContactName'),
                  variant: 'greyOnWhite',
                  icon: userSvg,
                },
              },
            ],
          })
        )

        const customName =
          result[0]?.type === 'inputResult'
            ? result[0].value
            : contact.info.name

        set(storedContactsAtom, (prev) => [
          ...prev,
          {
            ...contact,
            computedValues: Option.some(contact.computedValues),
            info: {...contact.info, name: customName},
          },
        ])

        const contactsPermissionsGranted = yield* _(
          areContactsPermissionsGranted()
        )

        const addToPhoneSuccess = contactsPermissionsGranted
          ? yield* _(
              set(addContactToPhoneWithUIFeedbackActionAtom, {
                customName,
                number: contact.computedValues.normalizedNumber,
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

        const submitContactsSuccess = yield* _(
          set(submitContactsActionAtom, {
            numbersToImport: deduplicate([
              ...Array.fromIterable(get(selectedNumbersAtom)),
              contact.computedValues.normalizedNumber,
            ]),
            normalizeAndImportAll: false,
            showOfferReencryptionDialog: false,
          })
        )

        set(searchTextAtom, '')
        reloadContacts()

        if (submitContactsSuccess) {
          yield* _(
            set(askAreYouSureActionAtom, {
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
            })
          )
        }
      })
    }
  )

  const editContactActionAtom = atom(
    null,
    (get, set, {contact}: {contact: StoredContactWithComputedValues}) => {
      return Effect.gen(function* (_) {
        const {t} = get(translationAtom)
        const contacts = get(storedContactsAtom)

        const result = yield* _(
          set(askAreYouSureActionAtom, {
            variant: 'info',
            steps: [
              {
                title: t('updateContactDialog.updateContact'),
                description: t('updateContactDialog.description'),
                subtitle: contact.computedValues.normalizedNumber,
                negativeButtonText: t('common.cancel'),
                positiveButtonText: t('common.save'),
                type: 'StepWithInput',
                textInputProps: {
                  autoFocus: true,
                  autoCorrect: false,
                  variant: 'greyOnWhite',
                  icon: userSvg,
                  placeholder: contact.info.name,
                },
              },
            ],
          })
        )

        const customName =
          result[0]?.type === 'inputResult'
            ? result[0].value
            : contact.info.name

        const updatedContacts = pipe(
          contacts,
          Array.findFirstIndex(
            (one) => one.info.rawNumber === contact.info.rawNumber
          ),
          Option.map((index) =>
            pipe(
              Array.modify(contacts, index, (one) => ({
                ...one,
                info: {...one.info, name: customName},
              }))
            )
          ),
          Option.getOrElse(() => contacts)
        )

        set(storedContactsAtom, updatedContacts)

        reloadContacts()

        yield* _(
          set(askAreYouSureActionAtom, {
            steps: [
              {
                type: 'StepWithText',
                title: t('common.success'),
                description: t(
                  'updateContactDialog.contactSuccessfullyUpdated'
                ),
                positiveButtonText: t('common.close'),
              },
            ],
            variant: 'info',
          })
        )
      }).pipe(Effect.ignore)
    }
  )

  return {
    selectAllAtom,
    searchTextAtom,
    createSelectContactAtom,
    createIsNewContactAtom,
    searchTextAsCustomContactAtom,
    addAndSelectContactWithUiFeedbackAtom,
    contactsFilterAtom,
    areThereAnyContactsToDisplayForSelectedTabAtom,
    selectedNumbersAtom,
    submitAllSelectedContactsActionAtom,
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
    editContactActionAtom,
  }
})
