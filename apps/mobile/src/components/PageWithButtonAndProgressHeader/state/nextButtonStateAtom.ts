import {atom, type ExtractAtomValue} from 'jotai'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

export interface NextButtonState {
  text: string | null
  onPress: (() => void) | null
  disabled: boolean
}
const nextButtonStateAtom = atom<NextButtonState>({
  text: null,
  onPress: () => {},
  disabled: true,
})

export default nextButtonStateAtom

export function useSetNextButtonState(
  set: () => ExtractAtomValue<typeof nextButtonStateAtom>
): void {
  const setNextButton = useSetAtom(nextButtonStateAtom)
  useFocusEffect(
    useCallback(() => {
      setNextButton(set())
    }, [setNextButton, set])
  )
}
