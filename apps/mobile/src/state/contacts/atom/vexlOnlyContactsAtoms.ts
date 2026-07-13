import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Option, pipe} from 'effect'
import {getPermissionsAsync} from 'expo-contacts'
import {atom} from 'jotai'
import {type ContactInfo, type StoredContactWithComputedValues} from '../domain'
import {
  areContactsPermissionsAlreadyGranted,
  getContactsAndTryToResolveThePermissionsAlongTheWay,
  UnknownContactsError,
} from '../utils'
import {normalizedContactsAtom, storedContactsAtom} from './contactsStore'

export interface DeviceContactsSnapshot {
  readonly rawNumbers: ReadonlySet<string>
  /**
   * False when contacts access is "limited" (iOS) - the visible contacts are
   * only a subset of the address book, so absence from `rawNumbers` does not
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

export interface NormalizedNumbersOnDevice {
  readonly normalizedNumbers: ReadonlySet<E164PhoneNumber>
  readonly isComplete: boolean
}

/**
 * Normalized numbers of stored contacts that are currently present in the
 * device address book. `undefined` when device contacts are not available.
 */
export const normalizedNumbersOnDeviceAtom = atom(
  (get): NormalizedNumbersOnDevice | undefined => {
    const deviceContactsSnapshot = get(deviceContactsSnapshotAtom)
    if (deviceContactsSnapshot === undefined) return undefined

    return {
      isComplete: deviceContactsSnapshot.isComplete,
      normalizedNumbers: new Set(
        pipe(
          get(storedContactsAtom),
          Array.filter((contact) =>
            deviceContactsSnapshot.rawNumbers.has(contact.info.rawNumber)
          ),
          Array.filterMap((contact) =>
            contact.computedValues.pipe(
              Option.map((computedValues) => computedValues.normalizedNumber)
            )
          )
        )
      ),
    }
  }
)

export function isVexlOnlyContact(
  contact: StoredContactWithComputedValues,
  numbersOnDevice: NormalizedNumbersOnDevice | undefined
): boolean {
  // Without access to the device address book fall back to the manual flag
  if (numbersOnDevice === undefined) return contact.flags.importedManually

  const isOnDevice = numbersOnDevice.normalizedNumbers.has(
    contact.computedValues.normalizedNumber
  )

  // With limited access we only see a subset of the address book, so treat
  // only manually added contacts as Vexl-only to avoid flagging phone
  // contacts outside the granted subset.
  if (!numbersOnDevice.isComplete)
    return contact.flags.importedManually && !isOnDevice

  return !isOnDevice
}

export const vexlOnlyContactsAtom = atom(
  (get): StoredContactWithComputedValues[] => {
    const numbersOnDevice = get(normalizedNumbersOnDeviceAtom)

    return pipe(
      get(normalizedContactsAtom),
      Array.filter((contact) => isVexlOnlyContact(contact, numbersOnDevice))
    )
  }
)
