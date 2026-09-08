import {Array, Effect, Option, pipe} from 'effect'
import {getPermissionsAsync} from 'expo-contacts'
import {atom} from 'jotai'
import {
  type ContactInfo,
  type NormalizedContactValue,
  type StoredContactWithComputedValues,
} from '../domain'
import {
  areContactsPermissionsAlreadyGranted,
  getContactsAndTryToResolveThePermissionsAlongTheWay,
  UnknownContactsError,
} from '../utils'
import {normalizedContactsAtom, storedContactsAtom} from './contactsStore'

export interface DeviceContactsSnapshot {
  readonly rawValues: ReadonlySet<string>
  /**
   * False when contacts access is "limited" (iOS) - the visible contacts are
   * only a subset of the address book, so absence from `rawValues` does not
   * prove a contact is missing from the phone.
   */
  readonly isComplete: boolean
}

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
      // if we can't tell, assume full access - the safer default for display
      Effect.catchAll(() => Effect.succeed(true)),
      Effect.map((isComplete) => {
        set(deviceContactsSnapshotAtom, {
          rawValues: new Set(
            Array.map(contactsFromDevice, (one) => one.rawValue)
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

export interface NormalizedValuesOnDevice {
  readonly normalizedValues: ReadonlySet<NormalizedContactValue>
  readonly isComplete: boolean
}

/**
 * Normalized numbers and emails of stored contacts that are currently present
 * in the device address book. `undefined` when device contacts are not
 * available.
 */
export const normalizedValuesOnDeviceAtom = atom(
  (get): NormalizedValuesOnDevice | undefined => {
    const deviceContactsSnapshot = get(deviceContactsSnapshotAtom)
    if (deviceContactsSnapshot === undefined) return undefined

    return {
      isComplete: deviceContactsSnapshot.isComplete,
      normalizedValues: new Set(
        pipe(
          get(storedContactsAtom),
          Array.filter((contact) =>
            deviceContactsSnapshot.rawValues.has(contact.info.rawValue)
          ),
          Array.filterMap((contact) =>
            contact.computedValues.pipe(
              Option.map((computedValues) => computedValues.normalizedValue)
            )
          )
        )
      ),
    }
  }
)

export function isVexlOnlyContact(
  contact: StoredContactWithComputedValues,
  valuesOnDevice: NormalizedValuesOnDevice | undefined
): boolean {
  // Without access to the device address book fall back to the manual flag
  if (valuesOnDevice === undefined) return contact.flags.importedManually

  const isOnDevice = valuesOnDevice.normalizedValues.has(
    contact.computedValues.normalizedValue
  )

  // With limited access we only see a subset of the address book, so treat
  // only manually added contacts as Vexl-only to avoid flagging phone
  // contacts outside the granted subset.
  if (!valuesOnDevice.isComplete)
    return contact.flags.importedManually && !isOnDevice

  return !isOnDevice
}

export const vexlOnlyContactsAtom = atom(
  (get): StoredContactWithComputedValues[] => {
    const valuesOnDevice = get(normalizedValuesOnDeviceAtom)

    return pipe(
      get(normalizedContactsAtom),
      Array.filter((contact) => isVexlOnlyContact(contact, valuesOnDevice))
    )
  }
)

export const vexlOnlyContactsCountAtom = atom(
  (get) => get(vexlOnlyContactsAtom).length
)
