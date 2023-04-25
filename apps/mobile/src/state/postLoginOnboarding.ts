import {useAtomValue, useSetAtom} from 'jotai'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'

export const postLoginFinishedStorageAtom = atomWithParsedMmkvStorage(
  'postLoginFinished1',
  {postLoginFinished: false},
  z.object({postLoginFinished: z.boolean()})
)
export const postLoginFinishedAtom = focusAtom(
  postLoginFinishedStorageAtom,
  (o) => o.prop('postLoginFinished')
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
