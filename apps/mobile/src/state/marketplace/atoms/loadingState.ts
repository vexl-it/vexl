import {atom} from 'jotai'
import {type LoadingState} from '../domain'

export const loadingStateAtom = atom<LoadingState>({state: 'initial'})
