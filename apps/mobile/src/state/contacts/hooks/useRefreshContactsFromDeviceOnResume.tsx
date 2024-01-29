import {useSetAtom} from 'jotai'
import {useOnAppState} from '../../../utils/useOnAppState'
import {triggerContactsReloadAtom} from '../atom/contactsFromDeviceAtom'

export default function useRefreshContactsFromDeviceOnResume(): void {
  const triggerContactsReload = useSetAtom(triggerContactsReloadAtom)

  useOnAppState(triggerContactsReload)
}
