import {Effect, type Either} from 'effect'
import {useSetAtom, type WritableAtom} from 'jotai'
import {useCallback} from 'react'

export function useAtomActionRunFork<A, P extends unknown[]>(
  atom: WritableAtom<unknown, P, Effect.Effect<A, any>>
): (...args: P) => void {
  const set = useSetAtom(atom)
  return useCallback(
    (...args) => {
      Effect.runFork(set(...args))
    },
    [set]
  )
}

export function useAtomActionRunPromise<A, I, P extends unknown[]>(
  atom: WritableAtom<unknown, P, Effect.Effect<A, I>>
): (...args: P) => Promise<Either.Either<A, I>> {
  const set = useSetAtom(atom)
  return useCallback(
    async (...args) => {
      return await Effect.runPromise(set(...args).pipe(Effect.either))
    },
    [set]
  )
}
