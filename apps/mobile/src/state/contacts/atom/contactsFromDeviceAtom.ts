import {type ContactNormalized} from '../domain'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils'
import {selectAtom} from 'jotai/utils'

const contactsFromDeviceWithLoadingProgressAtom = atom<
  | {loading: true}
  | {
      loading: false
      contacts: ContactNormalized[]
    }
>({loading: true})

export const contactsFromDeviceAtom = selectAtom(
  contactsFromDeviceWithLoadingProgressAtom,
  (s) => (s.loading ? [] : s.contacts)
)
export const contactsLoadingAtom = selectAtom(
  contactsFromDeviceWithLoadingProgressAtom,
  (s) => s.loading
)

contactsFromDeviceWithLoadingProgressAtom.onMount = (setAtom) => {
  void pipe(
    getContactsAndTryToResolveThePermissionsAlongTheWay(),
    TE.match(
      () => {
        setAtom({loading: false, contacts: []})
      },
      (contacts) => {
        setAtom({contacts, loading: false})
      }
    )
  )()
}
