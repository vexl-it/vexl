import {useFocusEffect} from '@react-navigation/native'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'

export interface FooterButtonState {
  text?: string
  onPress?: () => void
  disabled?: boolean
  hidden?: boolean
}

const primaryFooterButtonStateAtom = atom<FooterButtonState>({
  text: undefined,
  disabled: false,
  hidden: true,
  onPress: () => {},
})

const secondaryFooterButtonStateAtom = atom<FooterButtonState>({
  text: undefined,
  disabled: false,
  hidden: false,
  onPress: () => {},
})

export {primaryFooterButtonStateAtom, secondaryFooterButtonStateAtom}

export function useSetPrimaryFooterButtonState(state: FooterButtonState): void {
  const setFooterButtonState = useSetAtom(primaryFooterButtonStateAtom)
  useFocusEffect(
    useCallback(() => {
      setFooterButtonState(state)
    }, [setFooterButtonState, state])
  )
}

export function useSetSecondaryFooterButtonState(
  state: FooterButtonState
): void {
  const setFooterButtonState = useSetAtom(secondaryFooterButtonStateAtom)
  useFocusEffect(
    useCallback(() => {
      setFooterButtonState(state)
    }, [setFooterButtonState, state])
  )
}
