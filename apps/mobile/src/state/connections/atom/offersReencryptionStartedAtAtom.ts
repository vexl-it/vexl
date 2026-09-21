import {atom} from 'jotai'

// Transient UI state: keep it out of persisted connection records.
export const offersReencryptionStartedAtAtom = atom<number | null>(null)
