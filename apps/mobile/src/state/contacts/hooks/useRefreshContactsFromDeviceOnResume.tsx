import {useSetAtom} from 'jotai'
import {triggerContactsReloadAtom} from '../atom/contactsFromDeviceAtom'
import {useOnFocusAndAppState} from '../../../components/ContactListSelect/utils'

export default function useRefreshContactsFromDeviceOnResume(): void {
  const triggerContactsReload = useSetAtom(triggerContactsReloadAtom)

  useOnFocusAndAppState(triggerContactsReload)
}
