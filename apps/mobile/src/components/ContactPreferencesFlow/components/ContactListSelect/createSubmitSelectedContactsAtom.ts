import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, HashMap, pipe} from 'effect'
import {atom, type Atom, type WritableAtom} from 'jotai'
import connectionStateAtom, {
  reachNumberAtom,
} from '../../../../state/connections/atom/connectionStateAtom'
import {normalizedContactsAtom} from '../../../../state/contacts/atom/contactsStore'
import {submitContactsActionAtom} from '../../../../state/contacts/atom/submitContactsActionAtom'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../utils/localization/formattingLocaleAtom'
import {toastNotificationAtom} from '../../../ToastNotification/atom'
import {
  buildContactReachGraph,
  getNewPeopleThroughContacts,
} from './contactReach'

export function createSubmitSelectedContactsAtom({
  selectedNumbersAtom,
  shouldShowContactImportProgressDialogAtom,
}: {
  readonly selectedNumbersAtom: Atom<ReadonlySet<E164PhoneNumber>>
  readonly shouldShowContactImportProgressDialogAtom: Atom<boolean>
}): WritableAtom<null, [], Effect.Effect<boolean>> {
  return atom(null, (get, set) =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)
      const locale = get(formattingLocaleAtom)
      const selected = get(selectedNumbersAtom)
      const contacts = get(normalizedContactsAtom)
      const before = get(connectionStateAtom)
      const added = pipe(
        contacts,
        Array.filter(
          (contact) =>
            !contact.flags.imported &&
            selected.has(contact.computedValues.normalizedNumber)
        )
      )
      const previouslyReached = new Set([
        ...before.firstLevel,
        ...before.secondLevel,
        ...HashMap.keys(before.commonFriends),
      ])
      let connectionsRefreshed = false
      const result = yield* _(
        set(submitContactsActionAtom, {
          onConnectionsRefresh: (succeeded) => {
            connectionsRefreshed = succeeded
          },
          numbersToImport: Array.fromIterable(selected),
          normalizeAndImportAll: false,
          showOfferReencryptionDialog: selected.size > 0,
          manageLoadingOverlay: false,
          showContactImportProgressDialog: get(
            shouldShowContactImportProgressDialogAtom
          ),
        })
      )
      if (result !== 'success') return false
      const after = get(connectionStateAtom)
      if (!connectionsRefreshed || after.lastUpdate <= before.lastUpdate) {
        set(toastNotificationAtom, t('contacts.contactsSubmitted'))
        return true
      }
      const afterGraph = buildContactReachGraph(
        HashMap.entries(after.commonFriends),
        after.syncedContactHashes ?? new Set(),
        new Set(after.firstLevel)
      )
      const gain =
        before.lastUpdate > 0
          ? getNewPeopleThroughContacts(
              previouslyReached,
              afterGraph,
              Array.map(added, (contact) => contact.computedValues.hash)
            )
          : 0
      const [addedContact] = added
      const count = gain > 0 ? gain : get(reachNumberAtom)
      const countParams = {count, localizedString: formatInteger(count, locale)}
      set(
        toastNotificationAtom,
        gain === 0
          ? t('contacts.contactsSubmittedReach', countParams)
          : added.length === 1 && addedContact !== undefined
            ? t('contacts.contactsSubmittedGain', {
                ...countParams,
                name: addedContact.info.name,
              })
            : t('contacts.contactsSubmittedGainMultiple', countParams)
      )
      return true
    })
  )
}
