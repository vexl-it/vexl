import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {focusAtom} from 'jotai-optics'
import {
  ContactNormalizedWithHash,
  type ImportContactFromLinkPayload,
} from './domain'
import {atom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {pipe} from 'fp-ts/function'
import {toE164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {hashPhoneNumber} from './utils'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {privateApiAtom} from '../../api'
import {type ExtractLeftTE} from '@vexl-next/rest-api/dist/services/chat/utils'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import {type CryptoError} from '@vexl-next/resources-utils/dist/utils/crypto'

export const importedContactsStorageAtom = atomWithParsedMmkvStorage(
  'importedContacts',
  {importedContacts: []},
  z.object({importedContacts: z.array(ContactNormalizedWithHash)})
)
export const importedContactsAtom = focusAtom(
  importedContactsStorageAtom,
  (o) => o.prop('importedContacts')
)

export const importedContactsHashesAtom = selectAtom(
  importedContactsAtom,
  (o) => o.map((one) => one.hash)
)

export function selectImportedContactsWithHashes(
  hashes: readonly string[]
): Atom<ContactNormalizedWithHash[]> {
  return selectAtom(importedContactsAtom, (importedContacts) => {
    return importedContacts.filter((one) => hashes.includes(one.hash))
  })
}

export type BadPhoneNumberError = BasicError<'BadPhoneNumberError'>
export const importContactFromLinkActionAtom = atom(
  null,
  (
    get,
    set,
    importedContact: ImportContactFromLinkPayload
  ): TE.TaskEither<
    | BadPhoneNumberError
    | CryptoError
    | ExtractLeftTE<ReturnType<ContactPrivateApi['importContacts']>>,
    'ok'
  > =>
    pipe(
      importedContact.numberToDisplay,
      toE164PhoneNumber,
      E.fromOption(
        () =>
          ({
            _tag: 'BadPhoneNumberError',
            error: new Error('Bad phone number'),
          } as const)
      ),
      E.bindTo('normalizedPhoneNumber'),
      E.bindW('hash', ({normalizedPhoneNumber}) =>
        hashPhoneNumber(normalizedPhoneNumber)
      ),
      E.map(
        ({hash, normalizedPhoneNumber}): ContactNormalizedWithHash => ({
          ...importedContact,
          hash,
          fromContactList: false,
          numberToDisplay: importedContact.numberToDisplay,
          name: importedContact.name,
          label: importedContact.label,
          imageUri: importedContact.imageUri,
          normalizedNumber: normalizedPhoneNumber,
        })
      ),
      TE.fromEither,
      TE.chainFirstW((newContact) => {
        return get(privateApiAtom).contact.importContacts({
          contacts: [
            ...get(importedContactsAtom).map((one) => one.hash),
            newContact.hash,
          ],
        })
      }),
      TE.map((newContact) => {
        set(importedContactsAtom, (prev) => [...prev, newContact])
        return 'ok' as const
      })
    )
)
