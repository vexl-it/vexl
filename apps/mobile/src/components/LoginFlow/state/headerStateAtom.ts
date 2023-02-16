import {atom, type ExtractAtomValue} from 'jotai'
import {useSetAtom} from 'jotai'
import {type DependencyList, useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

const headerStateAtom = atom<{
  showBackButton: boolean
  progressNumber: number
} | null>({
  showBackButton: false,
  progressNumber: 0,
})

export default headerStateAtom

export function useSetHeaderState(
  getState: () => ExtractAtomValue<typeof headerStateAtom>,
  deps: DependencyList
): void {
  const setHeaderState = useSetAtom(headerStateAtom)
  useFocusEffect(
    useCallback(() => {
      setHeaderState(getState())
    }, deps)
  )
}
