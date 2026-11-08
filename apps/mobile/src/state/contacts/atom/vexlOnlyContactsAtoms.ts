import {Array, Effect, Option, pipe} from 'effect'
import {getPermissionsAsync} from 'expo-contacts'
import {atom} from 'jotai'
import {
  canDetectContactsRemovedFromPhone,
  createIsOnDevice,
  type DeviceContactsSnapshot,
  syncStoredContactsWithDevice,
} from '../deviceContactsSync'
import {type ContactInfo, type StoredContactWithComputedValues} from '../domain'
import {
  areContactsPermissionsAlreadyGranted,
  getContactsAndTryToResolveThePermissionsAlongTheWay,
  UnknownContactsError,
} from '../utils'
import {normalizedContactsAtom, storedContactsAtom} from './contactsStore'

/**
 * Contacts currently present in the device address book. Session only -
 * refreshed on app start (loadContactsFromDeviceActionAtom) and whenever the
 * contact preferences screen gains focus. `undefined` means the device
 * contacts could not be read (permissions).
 */
export const deviceContactsSnapshotAtom = atom<
  DeviceContactsSnapshot | undefined
>(undefined)

export const setDeviceContactsSnapshotFromContactsActionAtom = atom(
  null,
  (get, set, contactsFromDevice: readonly ContactInfo[]) =>
    Effect.tryPromise({
      try: async () => await getPermissionsAsync(),
      catch: (e) => new UnknownContactsError({cause: e}),
    }).pipe(
      Effect.map((permissions) => permissions.accessPrivileges !== 'limited'),
      // if we can't tell, assume limited access so no contact gets removed
      Effect.catchAll(() => Effect.succeed(false)),
      Effect.map((isComplete) => {
        set(deviceContactsSnapshotAtom, {
          rawNumbers: new Set(
            Array.map(contactsFromDevice, (one) => one.rawNumber)
          ),
          isComplete,
        })
      })
    )
)

export const refreshDeviceContactsSnapshotActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const permissionsGranted = yield* _(areContactsPermissionsAlreadyGranted())
    if (!permissionsGranted) {
      set(deviceContactsSnapshotAtom, undefined)
      return
    }

    const contactsFromDevice = yield* _(
      getContactsAndTryToResolveThePermissionsAlongTheWay()
    )
    yield* _(
      set(setDeviceContactsSnapshotFromContactsActionAtom, contactsFromDevice)
    )
  }).pipe(
    Effect.catchAll(() =>
      Effect.sync(() => {
        set(deviceContactsSnapshotAtom, undefined)
      })
    )
  )
)

const isOnDeviceAtom = atom(
  (get): ((contact: StoredContactWithComputedValues) => boolean) => {
    const snapshot = get(deviceContactsSnapshotAtom)
    if (snapshot === undefined) return () => false

    const isOnDevice = createIsOnDevice(
      get(storedContactsAtom),
      snapshot.rawNumbers
    )
    return (contact) =>
      isOnDevice(
        contact.info.rawNumber,
        Option.some(contact.computedValues.normalizedNumber)
      )
  }
)

export const syncStoredContactsWithDeviceActionAtom = atom(null, (get, set) => {
  const snapshot = get(deviceContactsSnapshotAtom)
  set(storedContactsAtom, (prev) =>
    syncStoredContactsWithDevice(prev, snapshot)
  )
})

/**
 * Phone contacts that are active in the network but no longer in the phone.
 */
export const contactsRemovedFromPhoneAtom = atom(
  (get): StoredContactWithComputedValues[] => {
    if (!canDetectContactsRemovedFromPhone(get(deviceContactsSnapshotAtom)))
      return []

    const isOnDevice = get(isOnDeviceAtom)
    return pipe(
      get(normalizedContactsAtom),
      Array.filter(
        (contact) =>
          contact.flags.imported &&
          !contact.flags.importedManually &&
          !isOnDevice(contact)
      )
    )
  }
)

export const vexlOnlyContactsAtom = atom(
  (get): StoredContactWithComputedValues[] => {
    const isOnDevice = get(isOnDeviceAtom)

    return pipe(
      get(normalizedContactsAtom),
      Array.filter(
        (contact) => contact.flags.importedManually && !isOnDevice(contact)
      )
    )
  }
)

export const vexlOnlyContactsCountAtom = atom(
  (get) => get(vexlOnlyContactsAtom).length
)
