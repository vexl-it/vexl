import {Array, pipe} from 'effect/index'
import {getPermissionsAsync} from 'expo-contacts'
import {getDefaultStore} from 'jotai'
import {difference} from 'set-operations'
import {importedContactsAtom} from '../state/contacts/atom/contactsStore'
import {mapContactsFromSystemToDomain} from '../state/contacts/contactMapping'
import {getDeviceContactsFromSystem} from '../state/contacts/getDeviceContactsFromSystem'
import {normalizeContactValue} from '../state/contacts/utils'

export default async function checkContactSync(
  store: ReturnType<typeof getDefaultStore> = getDefaultStore()
): Promise<'allSynced' | 'notAllContactsImported' | 'noPermissions'> {
  if (!(await getPermissionsAsync()).granted) {
    console.info('Contact permissions not granted. Unable to check')
    return 'noPermissions'
  }

  const deviceContactsValues = pipe(
    mapContactsFromSystemToDomain(await getDeviceContactsFromSystem()).contacts,
    Array.filterMap((one) => normalizeContactValue(one.kind, one.rawValue))
  )

  const storedContactsValues = pipe(
    store.get(importedContactsAtom),
    Array.map((one) => one.computedValues.normalizedValue)
  )

  const newContacts = difference(deviceContactsValues, storedContactsValues)
  if (newContacts.length > 0) {
    return 'notAllContactsImported'
  }
  return 'allSynced'
}
