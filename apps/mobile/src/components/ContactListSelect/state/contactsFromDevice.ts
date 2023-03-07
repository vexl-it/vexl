import * as O from 'fp-ts/Option'
import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {pipe} from 'fp-ts/function'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils/getContactsAndTryToResolveThePermissionsAlongTheWay'
import * as TE from 'fp-ts/TaskEither'
import {atom, useAtomValue} from 'jotai'

export const contactsFromDeviceAtom = atom<O.Option<ContactNormalized[]>>(
  O.none
)

contactsFromDeviceAtom.onMount = (setAtom) => {
  void pipe(
    getContactsAndTryToResolveThePermissionsAlongTheWay(),
    TE.match(
      () => {},
      (contacts) => {
        setAtom(O.some(contacts))
      }
    )
  )()
}

export default function useContactsFromDevice(): O.Option<ContactNormalized[]> {
  return useAtomValue(contactsFromDeviceAtom)
}
