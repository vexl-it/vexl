import {atom, type ExtractAtomValue} from 'jotai'
import {useSetAtom} from 'jotai/index'
import {type DependencyList, useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

const nextButtonAtom = atom<{
  text?: string
  onPress?: () => void
}>({
  text: undefined,
  onPress: () => {},
})

export default nextButtonAtom

export function useSetNextButton(
  set: () => ExtractAtomValue<typeof nextButtonAtom>,
  deps: DependencyList
): void {
  const setNextButton = useSetAtom(nextButtonAtom)
  useFocusEffect(
    useCallback(() => {
      setNextButton(set())
    }, deps)
  )
}
