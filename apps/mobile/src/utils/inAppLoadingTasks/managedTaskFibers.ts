import {Effect, Fiber} from 'effect'
import {globalValue} from 'effect/GlobalValue'

/**
 * Module-level registry of long-running background fibers that device
 * migration quiescence must be able to interrupt and await: in-app loading
 * task waves and the foreground notification-stream fiber.
 *
 * The previous fire-and-forget `void Effect.runPromise(...)` calls kept no
 * fiber handle anywhere, so nothing could ever wait for (or interrupt)
 * running work. Fibers deregister themselves when they exit.
 */
const managedFibers = globalValue(
  Symbol.for('@vexl-next/mobile/managedTaskFibers'),
  () => new Set<Fiber.RuntimeFiber<unknown, unknown>>()
)

export const registerManagedTaskFiber = <A, E>(
  fiber: Fiber.RuntimeFiber<A, E>
): void => {
  managedFibers.add(fiber)
  fiber.addObserver(() => {
    managedFibers.delete(fiber)
  })
}

/**
 * Forks the effect on its own root fiber (like the old
 * `void Effect.runPromise(...)` call sites) but keeps the fiber tracked so
 * {@link interruptAndAwaitAllInAppLoadingTasks} can quiesce it.
 */
export const runForkManagedTask = <A, E>(
  effect: Effect.Effect<A, E>
): Fiber.RuntimeFiber<A, E> => {
  const fiber = Effect.runFork(effect)
  registerManagedTaskFiber(fiber)
  return fiber
}

/**
 * Interrupts every tracked fiber and waits until all of them have finished
 * interrupting. Used by source quiescence (spec: "Interrupt managed task and
 * notification-stream fibers").
 */
export const interruptAndAwaitAllInAppLoadingTasks = (): Effect.Effect<void> =>
  Effect.suspend(() => Fiber.interruptAll([...managedFibers]))

export const getManagedTaskFiberCount = (): number => managedFibers.size
