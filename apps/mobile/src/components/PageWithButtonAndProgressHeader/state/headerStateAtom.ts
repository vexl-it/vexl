import {atom, type ExtractAtomValue} from 'jotai'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

export interface HeaderState {
  showBackButton: boolean
  progressNumber: number | undefined
  hidden?: boolean
  goBack: () => void
}

const headerStateAtom = atom<HeaderState>({
  hidden: true,
  showBackButton: false,
  progressNumber: 0,
  goBack: () => undefined,
})

export default headerStateAtom

export function useSetHeaderState(
  getState: () => ExtractAtomValue<typeof headerStateAtom>
): void {
  const setHeaderState = useSetAtom(headerStateAtom)
  useFocusEffect(
    useCallback(() => {
      setHeaderState(getState())
    }, [setHeaderState, getState])
  )
}
