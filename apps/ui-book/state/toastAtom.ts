import {type ToastMessage} from '@vexl-next/ui'
import {atom} from 'jotai'

export const toastAtom = atom<ToastMessage | null>(null)
