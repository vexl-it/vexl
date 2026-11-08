import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {type StoredContact} from '../domain'
import {normalizedContactsAtom, storedContactsAtom} from './contactsStore'
import loadAndNormalizeContactsFromDeviceActionAtom from './loadAndNormalizeContactsFromDeviceActionAtom'
import {SelectContactsToKeepInVexlComponent} from './SelectContactsToKeepInVexlComponent'
import {submitContactsActionAtom} from './submitContactsActionAtom'
import {contactsRemovedFromPhoneAtom} from './vexlOnlyContactsAtoms'

function hasNumberIn(
  numbers: ReadonlySet<E164PhoneNumber>
): (contact: StoredContact) => boolean {
  return (contact) =>
    Option.exists(contact.computedValues, (one) =>
      numbers.has(one.normalizedNumber)
    )
}

/**
 * Asks the user which active contacts deleted from the phone to keep in Vexl.
 * Kept ones become Vexl contacts, the rest leave the network. Dismissing the
 * dialog changes nothing, so the user is asked again on the next sync.
 */
export const askToResolveContactsRemovedFromPhoneActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const removedContacts = get(contactsRemovedFromPhoneAtom)
      // Never replace a dialog the user is already looking at
      if (!Array.isNonEmptyArray(removedContacts) || get(globalDialogAtom))
        return

      const {t} = get(translationAtom)
      const numbersToKeepAtom = atom<readonly E164PhoneNumber[]>([])

      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('contactsRemovedFromPhone.title'),
          subtitle: t('contactsRemovedFromPhone.description'),
          children: React.createElement(SelectContactsToKeepInVexlComponent, {
            contacts: removedContacts,
            numbersToKeepAtom,
          }),
          negativeButtonText: t('common.notNow'),
          positiveButtonText: t('common.confirm'),
        })
      )
      if (!confirmed) return

      const numbersToKeep = new Set(get(numbersToKeepAtom))
      set(storedContactsAtom, (prev) =>
        Array.map(prev, (contact) =>
          hasNumberIn(numbersToKeep)(contact)
            ? {...contact, flags: {...contact.flags, importedManually: true}}
            : contact
        )
      )

      // The dialog can stay open while the user edits the address book
      const addressBookReloaded = yield* _(
        set(loadAndNormalizeContactsFromDeviceActionAtom),
        Effect.match({onFailure: () => false, onSuccess: () => true})
      )
      if (!addressBookReloaded) return

      const shownNumbers = new Set(
        Array.map(
          removedContacts,
          (contact) => contact.computedValues.normalizedNumber
        )
      )
      const numbersToRemove = new Set(
        pipe(
          get(contactsRemovedFromPhoneAtom),
          Array.map((contact) => contact.computedValues.normalizedNumber),
          Array.filter((number) => shownNumbers.has(number))
        )
      )
      if (numbersToRemove.size === 0) return

      const activeNumbers = new Set(
        pipe(
          get(normalizedContactsAtom),
          Array.filter((contact) => contact.flags.imported),
          Array.map((contact) => contact.computedValues.normalizedNumber)
        )
      )
      const result = yield* _(
        set(submitContactsActionAtom, {
          normalizeAndImportAll: false,
          numbersToImport: pipe(
            Array.fromIterable(activeNumbers),
            Array.filter((number) => !numbersToRemove.has(number))
          ),
          showOfferReencryptionDialog: true,
        })
      )
      if (result !== 'success') {
        // A failed replace marks contacts inactive even though the server
        // still has them - restore them so the user is asked again
        set(storedContactsAtom, (prev) =>
          Array.map(prev, (contact) =>
            hasNumberIn(activeNumbers)(contact)
              ? {...contact, flags: {...contact.flags, imported: true}}
              : contact
          )
        )
        return
      }

      const isPendingRemoval = hasNumberIn(numbersToRemove)
      set(storedContactsAtom, (prev) =>
        Array.filter(prev, (contact) => !isPendingRemoval(contact))
      )
    })
)
