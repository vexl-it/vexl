import {Effect, Metric} from 'effect'

export const trackActiveCount =
  <A, E, R>(metric: Metric.Counter<number>) =>
  (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.acquireUseRelease(
      Metric.update(metric, 1),
      () => effect,
      () => Metric.update(metric, -1)
    )
