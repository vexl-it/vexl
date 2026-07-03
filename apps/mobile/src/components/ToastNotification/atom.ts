import {type ToastMessage} from '@vexl-next/ui'
import {atom} from 'jotai'

export const toastNotificationAtom = atom<ToastMessage | null>(null)
