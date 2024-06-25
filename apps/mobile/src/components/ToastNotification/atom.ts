import {atom} from 'jotai'
import {type ToastNotificationState} from './domain'

export const toastNotificationAtom = atom<ToastNotificationState | null>(null)
