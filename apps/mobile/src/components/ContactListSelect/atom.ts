import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type Atom, type SetStateAction, type WritableAtom} from 'jotai'
import {createScope, molecule} from 'bunshi/dist/react'
import {splitAtom} from 'jotai/utils'
import {matchSorter} from 'match-sorter'
import {Alert} from 'react-native'
import {privateApiAtom} from '../../api'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {
  combineContactsFromDeviceWithImportedContacts,
  combinedContactsAfterLastSubmitAtom,
  importedContactsAtom,
  lastImportOfContactsAtom,
} from '../../state/contacts'
import {contactsFromDeviceAtom} from '../../state/contacts/atom/contactsFromDeviceAtom'
import newlyAddedContactsToPhoneContactListAtom from '../../state/contacts/atom/newlyAddedContactsToPhoneContactListAtom'
import {
  ContactNormalized,
  type ContactNormalizedWithHash,
} from '../../state/contacts/domain'
import {hashPhoneNumber} from '../../state/contacts/utils'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {deduplicateBy} from '../../utils/deduplicate'
import {safeParse} from '../../utils/fpUtils'
import {translationAtom} from '../../utils/localization/I18nProvider'
import notEmpty from '../../utils/notEmpty'
import reportError from '../../utils/reportError'
import toE164PhoneNumberWithDefaultCountryCode from '../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import userSvg from '../images/userSvg'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import sequenceTasksWithAnimationFrames from '../../utils/sequenceTasksWithAnimationFrames'
import flattenTaskOfEithers from '@vexl-next/resources-utils/src/utils/flattenTaskOfEithers'
import {hashingProgressPercentageAtom} from '../ContactsHashingProgressModal/atoms'

export const ContactsSelectScope = createScope<{
  importedContacts: ContactNormalized[]
  initialFilters: {
    showSubmitted: boolean
    showNonSubmitted: boolean
    showNew: boolean
  }
}>({
  importedContacts: [],
  initialFilters: {
    showSubmitted: false,
    showNonSubmitted: false,
    showNew: false,
  },
})

export const newlyAddedCustomContactsAtom = atom<ContactNormalized[]>([])

export const contactSelectMolecule = molecule((getMolecule, getScope) => {
  const searchTextAtom = atom('')
  const {importedContacts, initialFilters} = getScope(ContactsSelectScope)

  const showSubmittedContactsAtom = atom<boolean>(initialFilters.showSubmitted)
  const showNonSubmittedContactsAtom = atom<boolean>(
    initialFilters.showNonSubmitted
  )
  const showNewContactsAtom = atom<boolean>(initialFilters.showNew)

  const selectedNumbersAtom = atom(
    new Set(importedContacts.map((one) => one.normalizedNumber))
  )

  const combinedContactsAtom = atom((get) => {
    return combineContactsFromDeviceWithImportedContacts({
      contactsFromDevice: get(contactsFromDeviceAtom),
      importedContacts,
    })
  })

  const allContactsAtom = atom((get) => {
    return [...get(combinedContactsAtom), ...get(newlyAddedCustomContactsAtom)]
  })

  const contactsToDisplayAtom = atom((get) => {
    const showSubmittedContacts = get(showSubmittedContactsAtom)
    const showNonSubmittedContacts = get(showNonSubmittedContactsAtom)
    const showNewContacts = get(showNewContactsAtom)
    const newlyAddedCustomContacts = get(newlyAddedCustomContactsAtom)
    const combinedContactsAfterLastSubmit =
      get(combinedContactsAfterLastSubmitAtom) ?? []
    const searchText = get(searchTextAtom)
    const allContacts = get(allContactsAtom)

    const filterActive =
      showNewContacts || showSubmittedContacts || showNonSubmittedContacts

    const contactsToShow = deduplicateBy(
      (() => {
        if (!filterActive) return allContacts

        return [
          ...(showNewContacts
            ? allContacts.filter(
                (contact) =>
                  !combinedContactsAfterLastSubmit
                    .map(
                      (lastSubmitContact) => lastSubmitContact.normalizedNumber
                    )
                    .includes(contact.normalizedNumber) &&
                  !newlyAddedCustomContacts
                    .map(
                      (newlyAddedCustomContact) =>
                        newlyAddedCustomContact.normalizedNumber
                    )
                    .includes(contact.normalizedNumber)
              )
            : []),
          ...(showSubmittedContacts ? importedContacts : []),
          ...(showNonSubmittedContacts
            ? [
                ...allContacts.filter(
                  (contact) =>
                    !importedContacts
                      .map(
                        (importedContact) => importedContact.normalizedNumber
                      )
                      .includes(contact.normalizedNumber) &&
                    combinedContactsAfterLastSubmit
                      .map(
                        (lastSubmitContact) =>
                          lastSubmitContact.normalizedNumber
                      )
                      .includes(contact.normalizedNumber)
                ),
                ...newlyAddedCustomContacts,
              ]
            : []),
        ]
      })(),
      (one) => one.normalizedNumber
    )

    return matchSorter(contactsToShow, searchText, {
      keys: ['name', 'numberToDisplay'],
    })
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
        (one) => !selectedNumbers.has(one.normalizedNumber)
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
          .map((one) => one.normalizedNumber)
          .forEach(shouldSelectAll ? newValue.add : newValue.delete, newValue)

        return newValue
      })
    }
  )

  function createIsNewContactAtom(
    contactAtom: Atom<ContactNormalized>
  ): Atom<boolean> {
    return atom((get) =>
      get(newlyAddedContactsToPhoneContactListAtom).includes(get(contactAtom))
    )
  }

  function createSelectContactAtom(
    contactAtom: Atom<ContactNormalized>
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) => get(selectedNumbersAtom).has(get(contactAtom).normalizedNumber),
      (get, set, number: SetStateAction<boolean>) => {
        const contactNumber = get(contactAtom).normalizedNumber
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
      O.chain((e164) =>
        O.fromEither(
          safeParse(ContactNormalized)({
            normalizedNumber: e164,
            numberToDisplay: searchText,
            name: searchText,
            fromContactList: false,
          })
        )
      )
    )
  })

  const addAndSelectContactWithUiFeedbackAtom = atom(
    null,
    async (get, set, contact: ContactNormalized) => {
      const {t} = get(translationAtom)

      await pipe(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              title: t('addContactDialog.addContact'),
              description: t('addContactDialog.addThisPhoneNumber'),
              subtitle: contact.normalizedNumber,
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
          result[0]?.type === 'inputResult' ? result[0].value : contact.name
        ),
        TE.map((customName) => {
          set(newlyAddedCustomContactsAtom, (val) => [
            ...val,
            {...contact, name: customName},
          ])
          set(selectedNumbersAtom, (val) => {
            const newVal = new Set(val)
            newVal.add(contact.normalizedNumber)
            return newVal
          })
          set(searchTextAtom, '')

          return customName
        }),
        TE.chainFirstW((customName) =>
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
          () => {
            // ignore that user closed dialog
          },
          () => {
            // Everything OK
          }
        )
      )()
    }
  )

  const submitActionAtom = atom(null, (get, set): T.Task<boolean> => {
    const contactApi = get(privateApiAtom).contact
    const {t} = get(translationAtom)

    const selectedNumbers = Array.from(get(selectedNumbersAtom))
    const allContacts = get(allContactsAtom)

    set(loadingOverlayDisplayedAtom, true)

    return pipe(
      selectedNumbers,
      A.map((oneNumber) =>
        allContacts.find(
          (oneContact) => oneContact.normalizedNumber === oneNumber
        )
      ),
      A.filter(notEmpty),
      A.map((oneContact) => {
        return pipe(
          E.Do,
          E.chainW(() => hashPhoneNumber(oneContact.normalizedNumber)),
          E.map((hash): ContactNormalizedWithHash => ({...oneContact, hash})),
          TE.fromEither
        )
      }),
      sequenceTasksWithAnimationFrames(300, (progress) => {
        set(hashingProgressPercentageAtom, progress * 100)
      }),
      flattenTaskOfEithers,
      TE.fromTask,
      TE.chainFirstW(({rights}) =>
        contactApi.importContacts({contacts: rights.map((one) => one.hash)})
      ),
      TE.match(
        (e) => {
          if (e._tag !== 'NetworkError') {
            reportError('error', 'error while submitting contacts', e)
          }

          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          return false
        },
        ({lefts, rights: importedContacts}) => {
          if (lefts.length > 0) {
            reportError('warn', 'Error when hashing phone numbers', lefts)
          }

          set(importedContactsAtom, [...importedContacts])

          const convertedToContactsNormalized: ContactNormalized[] =
            importedContacts.map((contact) => {
              const {hash, ...restProps} = contact
              return restProps
            })

          // need to save also custom contacts added through app
          // with deduplicating we extract them from returned imported contacts
          set(
            combinedContactsAfterLastSubmitAtom,
            deduplicateBy(
              [...get(combinedContactsAtom), ...convertedToContactsNormalized],
              (one) => one.normalizedNumber
            )
          )
          set(newlyAddedCustomContactsAtom, [])
          set(
            lastImportOfContactsAtom,
            IsoDatetimeString.parse(new Date().toISOString())
          )

          void set(syncConnectionsActionAtom)()
          void set(updateAllOffersConnectionsActionAtom, {
            isInBackground: false,
          })()
          return true
        }
      ),
      T.map((v) => {
        set(loadingOverlayDisplayedAtom, false)
        set(hashingProgressPercentageAtom, 0)
        return v
      })
    )
  })

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
