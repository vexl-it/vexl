import {Effect, Either, Fiber} from 'effect'
import {
  atom,
  type Atom,
  type Getter,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'

export type EffectAtomProgress<A, E> =
  | {
      state: 'initial'
    }
  | {state: 'loading'}
  | {
      state: 'done'
      result: Either.Either<A, E>
    }

export function createEffectAtomWithProgress<I, A, E>({
  effectToRun,
  inputAtom,
}: {
  inputAtom: PrimitiveAtom<I>
  effectToRun: (input: I, get: Getter) => Effect.Effect<A, E>
}): {
  resultAtom: Atom<EffectAtomProgress<A, E>>
  isInitialAtom: Atom<boolean>
  isLoadingAtom: Atom<boolean>
  errorAtom: Atom<E | null>
  successAtom: Atom<A | null>
  effectiveInputAtom: WritableAtom<I, [a: I], void>
} {
  const resultAtom = atom<EffectAtomProgress<A, E>>({state: 'initial'})
  const runningFiberAtom = atom<null | Fiber.Fiber<void, never>>(null)

  const effectiveInputAtom = atom(
    (get) => get(inputAtom),
    (get, set, input: I) => {
      set(inputAtom, input)

      const runningFiber = get(runningFiberAtom)
      if (runningFiber) Effect.runFork(Fiber.interruptFork(runningFiber))

      set(resultAtom, {state: 'loading'})

      const newFiber = Effect.runFork(
        effectToRun(input, get).pipe(
          Effect.either,
          Effect.andThen((result) => {
            set(resultAtom, {state: 'done', result})
          })
        )
      )

      set(runningFiberAtom, newFiber)
    }
  )

  const isInitialAtom = atom((get) => get(resultAtom).state === 'initial')
  const isLoadingAtom = atom((get) => get(resultAtom).state === 'loading')
  const errorAtom = atom((get) => {
    const result = get(resultAtom)

    if (result.state === 'done' && Either.isLeft(result.result)) {
      return result.result.left
    }
    return null
  })
  const successAtom = atom((get) => {
    const result = get(resultAtom)

    if (result.state === 'done' && Either.isRight(result.result)) {
      return result.result.right
    }
    return null
  })

  return {
    resultAtom,
    effectiveInputAtom,
    isInitialAtom,
    isLoadingAtom,
    errorAtom,
    successAtom,
  }
}
