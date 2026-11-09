import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, Equivalence, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {addNotificationToCenterActionAtom} from '../../../components/NotificationsScreen/state'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {displayLocalNotification} from '../../../utils/notifications/displayLocalNotification'
import {getDefaultChannel} from '../../../utils/notifications/notificationChannels'
import {
  canDetectContactsRemovedFromPhone,
  findActiveNumbers,
  findNumbersInPhone,
  findNumbersMissingFromPhone,
  findNumbersToRemoveFromNetwork,
  keepPhoneSyncState,
  nextPhoneSyncState,
  type PhoneSyncState,
} from '../deviceContactsSync'
import {type StoredContact} from '../domain'
import {lastPhoneSyncAtom, storedContactsAtom} from './contactsStore'
import {submitContactsActionAtom} from './submitContactsActionAtom'
import {deviceContactsSnapshotAtom} from './vexlOnlyContactsAtoms'

function hasNumberIn(
  numbers: ReadonlySet<E164PhoneNumber>
): (contact: StoredContact) => boolean {
  return (contact) =>
    Option.exists(contact.computedValues, (one) =>
      numbers.has(one.normalizedNumber)
    )
}

const sameNumbers = Array.getEquivalence(Equivalence.string)

const rememberPhoneSyncActionAtom = atom(
  null,
  (get, set, phoneSync: PhoneSyncState) => {
    const previous = get(lastPhoneSyncAtom)
    // Skip the write so the whole contacts store is not persisted again
    if (
      previous !== undefined &&
      sameNumbers(previous.numbersInPhone, phoneSync.numbersInPhone) &&
      sameNumbers(previous.numbersMissing, phoneSync.numbersMissing)
    )
      return
    set(lastPhoneSyncAtom, phoneSync)
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
      const rawNumbersOnDevice = get(deviceContactsSnapshotAtom)
      if (!canDetectContactsRemovedFromPhone(rawNumbersOnDevice)) return

      const storedContacts = get(storedContactsAtom)
      const lastSync = get(lastPhoneSyncAtom)
      const numbersInPhone = findNumbersInPhone(
        storedContacts,
        rawNumbersOnDevice
      )
      const keepLastSync = (): void => {
        set(
          rememberPhoneSyncActionAtom,
          keepPhoneSyncState(lastSync, numbersInPhone)
        )
      }

      const missingFromPhone = findNumbersMissingFromPhone({
        storedContacts,
        rawNumbersOnDevice,
        lastSync,
      })
      const maybeNumbersToRemove = Option.flatMap(
        missingFromPhone,
        ({deleted}) => findNumbersToRemoveFromNetwork(storedContacts, deleted)
      )
      if (
        Option.isNone(missingFromPhone) ||
        Option.isNone(maybeNumbersToRemove)
      ) {
        keepLastSync()
        return
      }
      const nextSync = nextPhoneSyncState(
        numbersInPhone,
        missingFromPhone.value
      )
      const numbersToRemove = maybeNumbersToRemove.value
      if (numbersToRemove.size === 0) {
        set(rememberPhoneSyncActionAtom, nextSync)
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
        keepLastSync()
        return
      }

      const isRemoved = hasNumberIn(numbersToRemove)
      set(storedContactsAtom, (prev) =>
        Array.filter(prev, (contact) => !isRemoved(contact))
      )
      set(rememberPhoneSyncActionAtom, nextSync)
      yield* _(set(notifyContactsRemovedFromPhoneActionAtom))
    })
)
