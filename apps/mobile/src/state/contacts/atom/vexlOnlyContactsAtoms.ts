import {Array, Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {
  canDetectContactsRemovedFromPhone,
  createIsOnDevice,
  syncStoredContactsWithDevice,
} from '../deviceContactsSync'
import {type ContactInfo, type StoredContactWithComputedValues} from '../domain'
import {
  areContactsPermissionsAlreadyGranted,
  getContactsAndTryToResolveThePermissionsAlongTheWay,
} from '../utils'
import {normalizedContactsAtom, storedContactsAtom} from './contactsStore'

/**
 * Raw numbers of the device address book entries Vexl can read. Session only -
 * refreshed on app start (loadContactsFromDeviceActionAtom) and whenever the
 * contact preferences screen gains focus. `undefined` means the device
 * contacts could not be read (permissions).
 */
export const deviceContactsSnapshotAtom = atom<ReadonlySet<string> | undefined>(
  undefined
)

export const setDeviceContactsSnapshotFromContactsActionAtom = atom(
  null,
  (get, set, contactsFromDevice: readonly ContactInfo[]) => {
    set(
      deviceContactsSnapshotAtom,
      new Set(Array.map(contactsFromDevice, (one) => one.rawNumber))
    )
  }
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
    set(setDeviceContactsSnapshotFromContactsActionAtom, contactsFromDevice)
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

    const isOnDevice = createIsOnDevice(get(storedContactsAtom), snapshot)
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
 * Normalized numbers of stored contacts currently in the phone.
 */
export const numbersInPhoneAtom = atom((get) => {
  const isOnDevice = get(isOnDeviceAtom)
  return pipe(
    get(normalizedContactsAtom),
    Array.filter(isOnDevice),
    Array.map((contact) => contact.computedValues.normalizedNumber)
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
