import {type ContactNormalized} from '../brands/ContactNormalized.brand'
import {pipe} from 'fp-ts/function'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils/getContactsAndTryToResolveThePermissionsAlongTheWay'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'

export const contactsFromDeviceAtom = atom<ContactNormalized[]>([])

contactsFromDeviceAtom.onMount = (setAtom) => {
  void pipe(
    getContactsAndTryToResolveThePermissionsAlongTheWay(),
    TE.match(() => {
      setAtom([])
    }, setAtom)
  )()
}
