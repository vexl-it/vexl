import {useSetAtom} from 'jotai'
import {useOnFocusAndAppState} from '../../../components/ContactListSelect/utils'
import {triggerContactsReloadAtom} from '../atom/contactsFromDeviceAtom'

export default function useRefreshContactsFromDeviceOnResume(): void {
  const triggerContactsReload = useSetAtom(triggerContactsReloadAtom)

  useOnFocusAndAppState(triggerContactsReload)
}
