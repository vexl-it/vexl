import {createScope, molecule} from 'jotai-molecules'
import {
  ContactNormalized,
  type ContactNormalizedWithHash,
} from '../../state/contacts/domain'
import {type Atom, atom, type SetStateAction, type WritableAtom} from 'jotai'
import {matchSorter} from 'match-sorter'
import {contactsFromDeviceAtom} from './state/contactsFromDeviceAtom'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {pipe} from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import {safeParse} from '../../utils/fpUtils'
import {splitAtom} from 'jotai/utils'
import {privateApiAtom} from '../../api'
import {Alert} from 'react-native'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import {translationAtom} from '../../utils/localization/I18nProvider'
import reportError from '../../utils/reportError'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {
  importedContactsAtom,
  lastImportOfContactsAtom,
} from '../../state/contacts'
import notEmpty from '../../utils/notEmpty'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {hashPhoneNumber} from '../../state/contacts/utils'
import toE164PhoneNumberWithDefaultCountryCode from '../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

export const ContactsSelectScope = createScope<ContactNormalized[]>([])

function combineContactsFromDeviceWithImportedContacts({
  contactsFromDevice,
  importedContacts,
}: {
  contactsFromDevice: ContactNormalized[]
  importedContacts: ContactNormalized[]
}): ContactNormalized[] {
  const toReturn = [...contactsFromDevice]

  for (const oneContact of importedContacts) {
    if (!oneContact.fromContactList) {
      // If contact is not from contact list add it. We should display it.
      toReturn.push(oneContact)
      continue
    }

    if (
      !contactsFromDevice.some(
        (oneFromDevice) =>
          oneFromDevice.normalizedNumber === oneContact.normalizedNumber
      )
    ) {
      // Those contacts were imported but are not in contact list anymore
      toReturn.push({
        ...oneContact,
        fromContactList: false,
        imageUri: undefined,
      })
    }
  }

  return toReturn
}

export const contactSelectMolecule = molecule((getMolecule, getScope) => {
  const searchTextAtom = atom('')
  const importedContacts = getScope(ContactsSelectScope)

  const selectedNumbersAtom = atom(
    new Set(importedContacts.map((one) => one.normalizedNumber))
  )

  const newlyAddedCustomContactsAtom = atom<ContactNormalized[]>([])

  const combinedContacts = atom((get) =>
    combineContactsFromDeviceWithImportedContacts({
      contactsFromDevice: get(contactsFromDeviceAtom),
      importedContacts,
    })
  )

  const allContactsAtom = atom((get) => {
    return [...get(combinedContacts), ...get(newlyAddedCustomContactsAtom)]
  })

  const contactsToDisplayAtom = atom((get) => {
    const searchText = get(searchTextAtom)
    const allContacts = get(allContactsAtom)

    return matchSorter(allContacts, searchText, {
      keys: ['name', 'numberToDisplay'],
    })
  })
  const contactsToDisplayAtomsAtom = splitAtom(contactsToDisplayAtom)

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

  const addAndSelectContactAtom = atom(
    null,
    (get, set, contact: ContactNormalized) => {
      set(newlyAddedCustomContactsAtom, (val) => [...val, contact])
      set(selectedNumbersAtom, (val) => {
        const newVal = new Set(val)
        newVal.add(contact.normalizedNumber)
        return newVal
      })
      set(searchTextAtom, '')
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
          hashPhoneNumber(oneContact.normalizedNumber),
          E.map((hash): ContactNormalizedWithHash => ({...oneContact, hash}))
        )
      }),
      E.sequenceArray,
      TE.fromEither,
      TE.chainFirstW((contacts) =>
        contactApi.importContacts({contacts: contacts.map((one) => one.hash)})
      ),
      TE.match(
        (e) => {
          if (e._tag !== 'NetworkError') {
            reportError('error', 'error while submitting contacts', e)
          }

          Alert.alert(toCommonErrorMessage(e, t) ?? t('common.unknownError'))
          return false
        },
        (importedContacts) => {
          set(importedContactsAtom, [...importedContacts])
          set(
            lastImportOfContactsAtom,
            IsoDatetimeString.parse(new Date().toISOString())
          )
          void set(updateAllOffersConnectionsActionAtom, {
            isInBackground: false,
          })()
          return true
        }
      ),
      T.map((v) => {
        set(loadingOverlayDisplayedAtom, false)
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
    searchTextAsCustomContactAtom,
    addAndSelectContactAtom,
    submitActionAtom,
  }
})
