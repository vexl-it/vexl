import {useFocusEffect} from '@react-navigation/native'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'

export interface HeaderState {
  hidden?: boolean
  hiddenAllTheWay?: boolean
  title?: string
  onClose?: () => void
  goBack?: () => void
}

const headerStateAtom = atom<HeaderState>({
  hidden: true,
  title: undefined,
  hiddenAllTheWay: undefined,
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
