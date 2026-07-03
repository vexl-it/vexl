import {atom} from 'jotai'

export type BoardFilter = 'all' | 'mine'

export const boardFilterAtom = atom<BoardFilter>('all')
