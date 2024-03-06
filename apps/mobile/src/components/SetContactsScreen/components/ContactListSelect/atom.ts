import {safeParse} from '@vexl-next/resources-utils/src/utils/parsing'
import {createScope, molecule} from 'bunshi/dist/react'
import * as O from 'fp-ts/Option'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type Atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {matchSorter} from 'match-sorter'
import {addContactToPhoneWithUIFeedbackAtom} from '../../../../state/contacts/atom/addContactToPhoneWithUIFeedbackAtom'
import {storedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {
  StoredContactWithComputedValues,
  type StoredContact,
} from '../../../../state/contacts/domain'
import {hashPhoneNumber} from '../../../../state/contacts/utils'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {deduplicateBy} from '../../../../utils/deduplicate'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import userSvg from '../../../images/userSvg'

export const ContactsSelectScope = createScope<{
  normalizedContacts: StoredContactWithComputedValues[]
  initialFilters: {
    showSubmitted: boolean
    showNonSubmitted: boolean
    showNew: boolean
  }
  reloadContacts: () => void
}>({
  normalizedContacts: [],
  initialFilters: {
    showSubmitted: false,
    showNonSubmitted: false,
    showNew: false,
  },
  reloadContacts: () => {},
})

export const contactSelectMolecule = molecule((_, getScope) => {
  const searchTextAtom = atom('')
  const {normalizedContacts, initialFilters, reloadContacts} =
    getScope(ContactsSelectScope)

  const showSubmittedContactsAtom = atom<boolean>(initialFilters.showSubmitted)
  const showNonSubmittedContactsAtom = atom<boolean>(
    initialFilters.showNonSubmitted
  )
  const showNewContactsAtom = atom<boolean>(initialFilters.showNew)

  const selectedNumbersAtom = atom(
    new Set(
      normalizedContacts
        .filter((one) => one.flags.imported)
        .map((one) => one.computedValues.normalizedNumber)
    )
  )

  const contactsToDisplayAtom = atom((get) => {
    const showSubmittedContacts = get(showSubmittedContactsAtom)
    const showNonSubmittedContacts = get(showNonSubmittedContactsAtom)
    const showNewContacts = get(showNewContactsAtom)
    const searchText = get(searchTextAtom)

    const filterActive =
      showNewContacts || showSubmittedContacts || showNonSubmittedContacts

    const contactsToShow = deduplicateBy(
      (() => {
        if (!filterActive) return normalizedContacts

        const toShow: StoredContactWithComputedValues[] = []
        if (showNewContacts) {
          toShow.push(...normalizedContacts.filter((one) => !one.flags.seen))
        }
        if (showSubmittedContacts) {
          toShow.push(...normalizedContacts.filter((one) => one.flags.imported))
        }
        if (showNonSubmittedContacts) {
          toShow.push(
            ...normalizedContacts.filter((one) => !one.flags.imported)
          )
        }

        return toShow
      })(),
      (one) => one.computedValues.normalizedNumber
    )

    const result = matchSorter(contactsToShow, searchText, {
      keys: ['info.name', 'info.numberToDisplay'],
    })
    return result
  })

  const contactsToDisplayAtomsAtom = splitAtom(contactsToDisplayAtom)

  const areThereAnyContactsToDisplayAtom = atom((get) => {
    const contactsToDisplayAtom = get(contactsToDisplayAtomsAtom)

    return contactsToDisplayAtom.length !== 0
  })

  const selectAllAtom = atom(
    (get) => {
      const selectedNumbers = get(selectedNumbersAtom)
      const contactsToDisplay = get(contactsToDisplayAtom)
      return !contactsToDisplay.some(
        (one) => !selectedNumbers.has(one.computedValues.normalizedNumber)
      )
    },
    (get, set, update: SetStateAction<boolean>) => {
      const contactsToDisplay = get(contactsToDisplayAtom)
      const shouldSelectAll = getValueFromSetStateActionOfAtom(update)(() =>
        get(selectAllAtom)
      )
      set(selectedNumbersAtom, (value) => {
        const newValue = new Set(value)
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
        get(selectedNumbersAtom).has(
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

  const submitActionAtom = atom(null, (get, set): T.Task<boolean> => {
    const selectedNumbers = Array.from(get(selectedNumbersAtom))
    return set(submitContactsActionAtom, {
      numbersToImport: selectedNumbers,
      normalizeAndImportAll: false,
    })
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

          set(selectedNumbersAtom, (val) => {
            const newVal = new Set(val)
            newVal.add(contact.computedValues.normalizedNumber)
            return newVal
          })
          set(searchTextAtom, '')

          return customName
        }),
        TE.chainFirstTaskK((customName) =>
          set(addContactToPhoneWithUIFeedbackAtom, {
            customName,
            number: contact.computedValues.normalizedNumber,
          })
        ),
        TE.chainTaskK(() => set(submitActionAtom)),
        TE.chainFirstW((customName) => {
          reloadContacts()
          return set(askAreYouSureActionAtom, {
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
        })
      )()
    }
  )

  return {
    selectAllAtom,
    contactsToDisplayAtom,
    contactsToDisplayAtomsAtom,
    searchTextAtom,
    createSelectContactAtom,
    createIsNewContactAtom,
    searchTextAsCustomContactAtom,
    addAndSelectContactWithUiFeedbackAtom,
    submitActionAtom,
    showSubmittedContactsAtom,
    showNonSubmittedContactsAtom,
    showNewContactsAtom,
    areThereAnyContactsToDisplayAtom,
  }
})
