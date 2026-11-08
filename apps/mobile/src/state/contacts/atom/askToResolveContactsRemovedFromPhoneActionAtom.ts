import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {type StoredContact} from '../domain'
import {normalizedContactsAtom, storedContactsAtom} from './contactsStore'
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

      const numbersToRemove = new Set(
        pipe(
          removedContacts,
          Array.map((contact) => contact.computedValues.normalizedNumber),
          Array.filter((number) => !numbersToKeep.has(number))
        )
      )
      if (numbersToRemove.size === 0) return

      const result = yield* _(
        set(submitContactsActionAtom, {
          normalizeAndImportAll: false,
          numbersToImport: pipe(
            get(normalizedContactsAtom),
            Array.filter((contact) => contact.flags.imported),
            Array.map((contact) => contact.computedValues.normalizedNumber),
            Array.filter((number) => !numbersToRemove.has(number))
          ),
          showOfferReencryptionDialog: true,
        })
      )
      if (result !== 'success') return

      set(storedContactsAtom, (prev) =>
        Array.filter(prev, (contact) => !hasNumberIn(numbersToRemove)(contact))
      )
    })
)
