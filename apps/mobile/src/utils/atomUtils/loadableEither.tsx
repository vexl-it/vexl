import {Either} from 'effect'
import * as E from 'fp-ts/Either'
import {atom, type Atom} from 'jotai'
import {loadable} from 'jotai/utils'

export interface UnknownLoadingError {
  _tag: 'UnknownLoadingError'
  error: unknown
}

export type LoadableEither<L, R> =
  | {
      state: 'loading'
    }
  | {
      state: 'done'
      either: E.Either<L | UnknownLoadingError, R>
    }

export function loadableEither<Left, Right>(
  anAtom: Atom<Promise<E.Either<Left, Right>>>
): Atom<LoadableEither<Left, Right>> {
  const loadableAtom = loadable(anAtom)
  return atom((get): LoadableEither<Left, Right> => {
    const result = get(loadableAtom)
    if (result.state === 'loading') return {state: 'loading' as const}
    if (result.state === 'hasError')
      return {
        state: 'done' as const,
        either: E.left({
          _tag: 'UnknownLoadingError',
          error: result.error,
        } as UnknownLoadingError),
      }

    return {state: 'done', either: result.data}
  })
}

export type LoadableEffectEither<R, L> =
  | {
      state: 'loading'
    }
  | {
      state: 'done'
      either: Either.Either<R, L | UnknownLoadingError>
    }

export function loadableEffectEither<R, L>(
  anAtom: Atom<Promise<Either.Either<R, L>>>
): Atom<LoadableEffectEither<R, L>> {
  const loadableAtom = loadable(anAtom)
  return atom((get): LoadableEffectEither<R, L> => {
    const result = get(loadableAtom)
    if (result.state === 'loading') return {state: 'loading' as const}
    if (result.state === 'hasError')
      return {
        state: 'done' as const,
        either: Either.left({
          _tag: 'UnknownLoadingError',
          error: result.error,
        } as UnknownLoadingError),
      }

    return {state: 'done', either: result.data}
  })
}
