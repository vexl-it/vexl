import {z} from 'zod'
import {useSetAtom} from 'jotai'
import {ContactNormalized} from '../brands/ContactNormalized.brand'
import {atomWithParsedAsyncStorage} from '../../../utils/atomWithParsedAsyncStorage'
import * as O from 'fp-ts/Option'

export const customContactsAtom = atomWithParsedAsyncStorage(
  'selectedContacts1',
  [],
  z.array(ContactNormalized)
)

export function useAddCustomContact(): (
  customContact: ContactNormalized
) => void {
  const setCustomContacts = useSetAtom(customContactsAtom)

  return (contact: ContactNormalized) => {
    setCustomContacts((old) => [contact, ...(O.isSome(old) ? old.value : [])])
  }
}
