import {Array, pipe} from 'effect'
import {Contact, ContactField, type PartialContactDetails} from 'expo-contacts'

/**
 * Fields requested from the device for each contact when importing/syncing.
 * These are intentionally the ONLY fields read from the address book and they
 * map 1:1 to what {@link mapContactsFromSystemToDomain} consumes. Do NOT widen
 * this list - reading more contact data than necessary would violate Vexl's
 * data-minimization principle.
 */
const DEVICE_CONTACT_FIELDS = [
  ContactField.GIVEN_NAME,
  ContactField.FAMILY_NAME,
  ContactField.FULL_NAME,
  ContactField.PHONES,
] as const

interface LegacyDeviceContact {
  id: string
  firstName: string | null
  lastName: string | null
  name: string | null
  phoneNumbers: ReadonlyArray<{label?: string; number?: string}>
}

/**
 * Reshapes a contact returned by the modern `expo-contacts` API into the legacy
 * field shape consumed by {@link mapContactsFromSystemToDomain} (and its tests).
 * Keeping the mapper input stable means the domain mapping logic stays untouched
 * across the API migration.
 */
function toLegacyDeviceContact(
  contact: PartialContactDetails<typeof DEVICE_CONTACT_FIELDS>
): LegacyDeviceContact {
  return {
    id: contact.id,
    firstName: contact.givenName,
    lastName: contact.familyName,
    name: contact.fullName,
    phoneNumbers: contact.phones,
  }
}

/**
 * Loads all device contacts (using the system's default sort order) and returns
 * them already reshaped for {@link mapContactsFromSystemToDomain}.
 */
export async function getDeviceContactsFromSystem(): Promise<
  LegacyDeviceContact[]
> {
  const contacts = await Contact.getAllDetails(DEVICE_CONTACT_FIELDS)

  return pipe(contacts, Array.map(toLegacyDeviceContact))
}
