import {Effect, type Metric} from 'effect/index'

export const trackActiveCount =
  <A, E, R>(metric: Metric.Metric.Counter<number>) =>
  (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.acquireUseRelease(
      metric(Effect.succeed(1)),
      () => effect,
      () => metric(Effect.succeed(-1))
    )
