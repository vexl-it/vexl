import {useAtomValue, useSetAtom} from 'jotai'
import type O from 'fp-ts/Option'
import {atomWithParsedAsyncStorage} from '../utils/atomWithParsedAsyncStorage'
import {z} from 'zod'

export const postLoginFinishedAtom = atomWithParsedAsyncStorage(
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

export function useIsPostLoginFinished(): O.Option<boolean> {
  return useAtomValue(postLoginFinishedAtom)
}
