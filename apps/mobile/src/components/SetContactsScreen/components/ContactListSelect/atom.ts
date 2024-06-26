import {safeParse} from '@vexl-next/resources-utils/src/utils/parsing'
import {createScope, molecule} from 'bunshi/dist/react'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type Atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {matchSorter, rankings} from 'match-sorter'
import {type E164PhoneNumber} from '../../../../../../../packages/domain/src/general/E164PhoneNumber.brand'
import {addContactToPhoneWithUIFeedbackAtom} from '../../../../state/contacts/atom/addContactToPhoneWithUIFeedbackAtom'
import {storedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {
  StoredContactWithComputedValues,
  type ContactsFilter,
  type StoredContact,
} from '../../../../state/contacts/domain'
import {hashPhoneNumber} from '../../../../state/contacts/utils'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import deduplicate, {deduplicateBy} from '../../../../utils/deduplicate'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import checkIconSvg from '../../../ChatDetailScreen/components/images/checkIconSvg'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
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
  const contactsFilterAtom = atom<ContactsFilter>('submitted')

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

  const _contactsToDisplayAtom = atom((get) => {
    const contactsFilter = get(contactsFilterAtom)

    return get(
      contactsFilter === 'submitted'
        ? submittedContactsToDisplayAtom
        : contactsFilter === 'nonSubmitted'
          ? nonSubmittedContactsToDisplayAtom
          : newContactsToDisplayAtom
    )
  })

  const newContactsToDisplayAtomsAtom = splitAtom(newContactsToDisplayAtom)
  const submittedContactsToDisplayAtomsAtom = splitAtom(
    submittedContactsToDisplayAtom
  )
  const nonSubmittedContactsToDisplayAtomsAtom = splitAtom(
    nonSubmittedContactsToDisplayAtom
  )

  const selectedSubmittedNumbersAtom = atom(
    new Set(
      normalizedContacts
        .filter((one) => one.flags.imported)
        .map((one) => one.computedValues.normalizedNumber)
    )
  )

  const selectedNonSubmittedNumbersAtom = atom<Set<E164PhoneNumber>>(
    new Set([])
  )

  const selectedNewNumbersAtom = atom(
    new Set(
      normalizedContacts
        .filter((one) => !one.flags.seen)
        .map((one) => one.computedValues.normalizedNumber)
    )
  )

  const _allSelectedNumbersAtom = atom((get) => {
    return new Set([
      ...get(selectedSubmittedNumbersAtom),
      ...get(selectedNonSubmittedNumbersAtom),
      ...get(selectedNewNumbersAtom),
    ])
  })

  const selectedNumbersAtom = atom(
    (get) => {
      const contactsFilter = get(contactsFilterAtom)
      return get(
        contactsFilter === 'submitted'
          ? selectedSubmittedNumbersAtom
          : contactsFilter === 'nonSubmitted'
            ? selectedNonSubmittedNumbersAtom
            : selectedNewNumbersAtom
      )
    },
    (get, set, numbers: SetStateAction<Set<E164PhoneNumber>>) => {
      const contactsFilter = get(contactsFilterAtom)

      set(
        contactsFilter === 'submitted'
          ? selectedSubmittedNumbersAtom
          : contactsFilter === 'nonSubmitted'
            ? selectedNonSubmittedNumbersAtom
            : selectedNewNumbersAtom,
        numbers
      )
    }
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
    contactAtom: Atom<StoredContact>
  ): Atom<boolean> {
    return atom((get) => !get(contactAtom).flags.seen)
  }

  function createSelectContactAtom(
    contactAtom: Atom<StoredContactWithComputedValues>
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) =>
        get(_allSelectedNumbersAtom).has(
          get(contactAtom).computedValues.normalizedNumber
        ),
      (get, set, number: SetStateAction<boolean>) => {
        const contactNumber = get(contactAtom).computedValues.normalizedNumber
        const selected = getValueFromSetStateActionOfAtom(number)(() =>
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

  const submitSingleContactActionAtom = atom(
    null,
    (get, set, contact: StoredContactWithComputedValues) => {
      const selectedSubmittedNumbers = Array.from(
        get(selectedSubmittedNumbersAtom)
      )

      return pipe(
        set(submitContactsActionAtom, {
          numbersToImport: deduplicate([
            ...selectedSubmittedNumbers,
            contact.computedValues.normalizedNumber,
          ]),
          normalizeAndImportAll: false,
        })
      )
    }
  )

  const submitAllSelectedContactsActionAtom = atom(
    null,
    (get, set): T.Task<boolean> => {
      const {t} = get(translationAtom)
      const selectedSubmittedNumbers = Array.from(
        get(selectedSubmittedNumbersAtom)
      )
      const selectedNonSubmittedNumbers = Array.from(
        get(selectedNonSubmittedNumbersAtom)
      )
      const selectedNewNumbers = Array.from(get(selectedNewNumbersAtom))
      return pipe(
        set(submitContactsActionAtom, {
          numbersToImport: deduplicate([
            ...selectedSubmittedNumbers,
            ...selectedNonSubmittedNumbers,
            ...selectedNewNumbers,
          ]),
          normalizeAndImportAll: false,
        }),
        T.map((result) => {
          if (result) {
            set(toastNotificationAtom, {
              text: t('contacts.contactsSubmitted'),
              icon: checkIconSvg,
              hideAfterMillis: 2000,
            })
          }
          return result
        })
      )
    }
  )

  const searchTextAsCustomContactAtom = atom((get) => {
    const searchText = get(searchTextAtom)

    return pipe(
      searchText,
      toE164PhoneNumberWithDefaultCountryCode,
      O.bindTo('number'),
      O.bind('hash', ({number}) => O.fromEither(hashPhoneNumber(number))),
      O.chain(({number, hash}) =>
        O.fromEither(
          safeParse(StoredContactWithComputedValues)({
            info: {
              name: searchText,
              numberToDisplay: searchText,
              rawNumber: searchText,
            },
            computedValues: {
              hash,
              normalizedNumber: number,
            },
            flags: {
              seen: true,
              imported: false,
              importedManually: true,
              invalidNumber: 'valid',
            },
          } satisfies StoredContactWithComputedValues)
        )
      )
    )
  })

  const addAndSelectContactWithUiFeedbackAtom = atom(
    null,
    async (get, set, contact: StoredContactWithComputedValues) => {
      const {t} = get(translationAtom)

      await pipe(
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
        }),
        TE.map((result) =>
          result[0]?.type === 'inputResult'
            ? result[0].value
            : contact.info.name
        ),
        TE.map((customName) => {
          set(storedContactsAtom, (val) => [
            ...val,
            {...contact, info: {...contact.info, name: customName}},
          ])

          return customName
        }),
        TE.bindTo('customName'),
        TE.bindW('addToPhoneSuccess', ({customName}) =>
          pipe(
            set(addContactToPhoneWithUIFeedbackAtom, {
              customName,
              number: contact.computedValues.normalizedNumber,
            }),
            TE.fromTask
          )
        ),
        TE.chainFirstTaskK(() => set(submitSingleContactActionAtom, contact)),
        TE.chainFirstW(({addToPhoneSuccess, customName}) => {
          set(searchTextAtom, '')
          reloadContacts()
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
          })
        })
      )()
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
  }
})
