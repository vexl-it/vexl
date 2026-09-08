import {Effect, type Fiber, Result} from 'effect'
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
      result: Result.Result<A, E>
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
      if (runningFiber) runningFiber.interruptUnsafe()

      set(resultAtom, {state: 'loading'})

      const newFiber = Effect.runFork(
        effectToRun(input, get).pipe(
          Effect.result,
          Effect.andThen((result) =>
            Effect.sync(() => {
              set(resultAtom, {state: 'done', result})
            })
          )
        )
      )

      set(runningFiberAtom, newFiber)
    }
  )

  const isInitialAtom = atom((get) => get(resultAtom).state === 'initial')
  const isLoadingAtom = atom((get) => get(resultAtom).state === 'loading')
  const errorAtom = atom((get) => {
    const result = get(resultAtom)

    if (result.state === 'done' && Result.isFailure(result.result)) {
      return result.result.failure
    }
    return null
  })
  const successAtom = atom((get) => {
    const result = get(resultAtom)

    if (result.state === 'done' && Result.isSuccess(result.result)) {
      return result.result.success
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
