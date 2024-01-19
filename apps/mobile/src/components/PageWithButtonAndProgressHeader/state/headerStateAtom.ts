import {useFocusEffect} from '@react-navigation/native'
import {atom, useSetAtom, type ExtractAtomValue} from 'jotai'
import {useCallback} from 'react'

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
