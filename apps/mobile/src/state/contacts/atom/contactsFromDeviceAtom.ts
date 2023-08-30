import {type ContactNormalized} from '../domain'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils'

export const contactsFromDeviceAtom = atom<ContactNormalized[]>([])

contactsFromDeviceAtom.onMount = (setAtom) => {
  void pipe(
    getContactsAndTryToResolveThePermissionsAlongTheWay(),
    TE.match(() => {
      setAtom([])
    }, setAtom)
  )()
}
