import {Contact} from 'expo-contacts'
import {Platform} from 'react-native'
import {type NonUniqueContactId} from './domain'

// expo-contacts returns a raw filesystem path on iOS (no file:// scheme). For
// contacts synced from legacy sources the contact id — and thus the cached
// image filename — contains a colon (`<uuid>:ABPerson`), which React Native's
// new architecture misparses as a scheme separator, leaving the image
// unloadable (https://github.com/vexl-it/vexl/issues/1984). An explicit
// file:// scheme with percent-encoded segments keeps the uri unambiguous.
function toFileUri(path: string): string {
  return `file://${path.split('/').map(encodeURIComponent).join('/')}`
}

export async function getContactImageUri(
  contactId: NonUniqueContactId
): Promise<string | null> {
  const uri = await new Contact(contactId).getThumbnail()
  if (!uri) return null

  return Platform.OS === 'ios' && uri.startsWith('/') ? toFileUri(uri) : uri
}
