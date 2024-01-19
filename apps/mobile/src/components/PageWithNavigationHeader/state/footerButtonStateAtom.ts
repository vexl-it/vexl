import {useFocusEffect} from '@react-navigation/native'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'

export interface FooterButtonState {
  text?: string
  onPress: () => void
  disabled?: boolean
  hidden?: boolean
}

const footerButtonStateAtom = atom<FooterButtonState>({
  text: undefined,
  disabled: false,
  hidden: false,
  onPress: () => {},
})

export default footerButtonStateAtom

export function useSetFooterButtonState(state: FooterButtonState): void {
  const setFooterButtonState = useSetAtom(footerButtonStateAtom)
  useFocusEffect(
    useCallback(() => {
      setFooterButtonState(state)
    }, [setFooterButtonState, state])
  )
}
