import * as Contacts from 'expo-contacts'
import {SortTypes} from 'expo-contacts'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import notEmpty from './notEmpty'
import {importedContactsAtom} from '../state/contacts'
import {difference} from 'set-operations'
import {getDefaultStore} from 'jotai'

export default async function checkContactSync(
  store: ReturnType<typeof getDefaultStore> = getDefaultStore()
): Promise<'allSynced' | 'notAllContactsImported' | 'noPermissions'> {
  if (!(await Contacts.getPermissionsAsync()).granted) {
    console.info('Contact permissions not granted. Unable to check')
    return 'noPermissions'
  }

  const deviceContacts = await Contacts.getContactsAsync({
    sort: SortTypes.UserDefault,
  })
  const deviceContactsNumbers = deviceContacts.data
    .map(
      (one) =>
        one.phoneNumbers?.map((one) => {
          const parseResult = E164PhoneNumber.safeParse(one.number)
          if (parseResult.success) {
            return parseResult.data
          }
          return undefined
        })
    )
    .flat()
    .filter(notEmpty)

  const storedContactsNumbers = store
    .get(importedContactsAtom)
    .map((one) => one.normalizedNumber)

  const newContacts = difference(deviceContactsNumbers, storedContactsNumbers)
  if (newContacts.length > 0) {
    return 'notAllContactsImported'
  }
  return 'allSynced'
}
