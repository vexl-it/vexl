import {useAtomValue, useSetAtom} from 'jotai'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../utils/atomWithParsedMmkvStorage'

export const postLoginFinishedAtom = atomWithParsedMmkvStorage(
  'postLoginFinished1',
  false,
  z.boolean()
)

export function useFinishPostLoginFlow(): (f: boolean) => void {
  const setFinished = useSetAtom(postLoginFinishedAtom)
  return (finished: boolean) => {
    setFinished(finished)
  }
}

export function useIsPostLoginFinished(): boolean {
  return useAtomValue(postLoginFinishedAtom)
}
