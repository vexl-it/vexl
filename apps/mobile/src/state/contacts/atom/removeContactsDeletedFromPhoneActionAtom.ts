import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, Equivalence, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {addNotificationToCenterActionAtom} from '../../../components/NotificationsScreen/state'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {displayLocalNotification} from '../../../utils/notifications/displayLocalNotification'
import {getDefaultChannel} from '../../../utils/notifications/notificationChannels'
import {
  addNumbersInPhone,
  canDetectContactsRemovedFromPhone,
  findActiveNumbers,
  findNumbersDeletedFromPhone,
  findNumbersInPhone,
  findNumbersToRemoveFromNetwork,
} from '../deviceContactsSync'
import {type StoredContact} from '../domain'
import {
  needsFullContactsReplaceAfterContactEditAtom,
  numbersInPhoneAtLastSyncAtom,
  storedContactsAtom,
} from './contactsStore'
import {submitContactsActionAtom} from './submitContactsActionAtom'
import {loadedDeviceContactsSnapshotAtom} from './vexlOnlyContactsAtoms'

function hasNumberIn(
  numbers: ReadonlySet<E164PhoneNumber>
): (contact: StoredContact) => boolean {
  return (contact) =>
    Option.exists(contact.computedValues, (one) =>
      numbers.has(one.normalizedNumber)
    )
}

const sameNumbers = Array.getEquivalence(Equivalence.string)

/**
 * Overlapping runs on the same address book read would upload the same removal
 * twice. Compared by reference.
 */
const lastProcessedDeviceContactsSnapshotAtom = atom<
  ReadonlySet<string> | undefined
>(undefined)

const rememberNumbersInPhoneActionAtom = atom(
  null,
  (get, set, numbersInPhone: readonly E164PhoneNumber[]) => {
    const previous = get(numbersInPhoneAtLastSyncAtom)
    // Skip the write so the whole contacts store is not persisted again
    if (previous !== undefined && sameNumbers(previous, numbersInPhone)) return
    set(numbersInPhoneAtLastSyncAtom, numbersInPhone)
  }
)

const notifyContactsRemovedFromPhoneActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  set(addNotificationToCenterActionAtom, {
    _tag: 'ContactsRemovedFromPhoneNotificationData',
    removedAt: unixMillisecondsNow(),
  })

  return Effect.tryPromise(async () => {
    await displayLocalNotification({
      channelId: await getDefaultChannel(),
      content: {
        title: t('notifications.CONTACTS_REMOVED_FROM_PHONE.title'),
        body: t('notifications.CONTACTS_REMOVED_FROM_PHONE.body'),
      },
    })
  }).pipe(Effect.ignore)
})

/**
 * Removes active contacts deleted from the phone from the network, re-encrypts
 * offers and lets the user know. On failure nothing is removed, so it is
 * retried on the next sync.
 */
export const removeContactsDeletedFromPhoneActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const rawNumbersOnDevice = get(loadedDeviceContactsSnapshotAtom)
      if (
        !canDetectContactsRemovedFromPhone(rawNumbersOnDevice) ||
        rawNumbersOnDevice === get(lastProcessedDeviceContactsSnapshotAtom)
      )
        return
      set(lastProcessedDeviceContactsSnapshotAtom, rawNumbersOnDevice)

      const storedContacts = get(storedContactsAtom)
      const numbersInPhoneAtLastSync = get(numbersInPhoneAtLastSyncAtom)
      const keepRememberedNumbers = (): void => {
        set(
          rememberNumbersInPhoneActionAtom,
          addNumbersInPhone(
            numbersInPhoneAtLastSync,
            storedContacts,
            rawNumbersOnDevice
          )
        )
      }
      const rememberNumbersInPhone = (): void => {
        set(
          rememberNumbersInPhoneActionAtom,
          Array.fromIterable(
            findNumbersInPhone(storedContacts, rawNumbersOnDevice)
          )
        )
      }

      const maybeNumbersToRemove = Option.flatMap(
        findNumbersDeletedFromPhone({
          storedContacts,
          rawNumbersOnDevice,
          numbersInPhoneAtLastSync,
        }),
        (deleted) => findNumbersToRemoveFromNetwork(storedContacts, deleted)
      )
      if (
        Option.isNone(maybeNumbersToRemove) ||
        // The pending replace after a number edit must go first
        get(needsFullContactsReplaceAfterContactEditAtom)
      ) {
        keepRememberedNumbers()
        return
      }
      const numbersToRemove = maybeNumbersToRemove.value
      if (numbersToRemove.size === 0) {
        rememberNumbersInPhone()
        return
      }

      const activeNumbers = findActiveNumbers(storedContacts)
      const result = yield* _(
        set(submitContactsActionAtom, {
          normalizeAndImportAll: false,
          numbersToImport: pipe(
            Array.fromIterable(activeNumbers),
            Array.filter((number) => !numbersToRemove.has(number))
          ),
          showOfferReencryptionDialog: false,
          manageLoadingOverlay: false,
          showErrorAlerts: false,
        })
      )
      if (result !== 'success') {
        // A failed replace marks contacts inactive even though the server
        // still has them - restore them so removal is retried
        set(storedContactsAtom, (prev) =>
          Array.map(prev, (contact) =>
            hasNumberIn(activeNumbers)(contact)
              ? {...contact, flags: {...contact.flags, imported: true}}
              : contact
          )
        )
        keepRememberedNumbers()
        return
      }

      const isRemoved = hasNumberIn(numbersToRemove)
      set(storedContactsAtom, (prev) =>
        Array.filter(prev, (contact) => !isRemoved(contact))
      )
      rememberNumbersInPhone()
      yield* _(set(notifyContactsRemovedFromPhoneActionAtom))
    })
)
