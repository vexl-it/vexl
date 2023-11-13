import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

export interface HeaderState {
  hidden?: boolean
  title?: string
  onClose: () => void
  goBack: () => void
}

const headerStateAtom = atom<HeaderState>({
  hidden: true,
  title: undefined,
  goBack: () => undefined,
  onClose: () => undefined,
})

export default headerStateAtom

export function useSetHeaderState(state: HeaderState): void {
  const setHeaderState = useSetAtom(headerStateAtom)
  useFocusEffect(
    useCallback(() => {
      setHeaderState(state)
    }, [setHeaderState, state])
  )
}
