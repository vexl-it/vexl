import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ContactNormalized} from '../domain'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils'

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

export const triggerContactsReloadAtom = atom(null, (get, set) => {
  void pipe(
    getContactsAndTryToResolveThePermissionsAlongTheWay(),
    TE.match(
      () => {
        set(contactsFromDeviceWithLoadingProgressAtom, {
          loading: false,
          contacts: [],
        })
      },
      (contacts) => {
        set(contactsFromDeviceWithLoadingProgressAtom, {
          contacts,
          loading: false,
        })
      }
    )
  )()
})
