import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Option, Schema} from 'effect/index'
import {getPermissionsAsync} from 'expo-contacts'
import {getDefaultStore} from 'jotai'
import {difference} from 'set-operations'
import {importedContactsAtom} from '../state/contacts/atom/contactsStore'
import {getDeviceContactsFromSystem} from '../state/contacts/getDeviceContactsFromSystem'
import notEmpty from './notEmpty'

export default async function checkContactSync(
  store: ReturnType<typeof getDefaultStore> = getDefaultStore()
): Promise<'allSynced' | 'notAllContactsImported' | 'noPermissions'> {
  if (!(await getPermissionsAsync()).granted) {
    console.info('Contact permissions not granted. Unable to check')
    return 'noPermissions'
  }

  const deviceContacts = await getDeviceContactsFromSystem()
  const deviceContactsNumbers = deviceContacts
    .map((one) =>
      one.phoneNumbers?.map((one) => {
        const parseResult = Schema.decodeUnknownOption(E164PhoneNumber)(
          one.number
        )
        if (Option.isSome(parseResult)) {
          return parseResult.value
        }
        return undefined
      })
    )
    .flat()
    .filter(notEmpty)

  const storedContactsNumbers = store
    .get(importedContactsAtom)
    .map((one) => one.computedValues.normalizedNumber)

  const newContacts = difference(deviceContactsNumbers, storedContactsNumbers)
  if (newContacts.length > 0) {
    return 'notAllContactsImported'
  }
  return 'allSynced'
}
