import {Effect, Layer} from 'effect'
import {type DurationInput} from 'effect/Duration'

const formatMemoryUsage = (data: number): string =>
  `${Math.round((data / 1024 / 1024) * 100) / 100} MB`

export const makeMemoryDebugLayer = (
  logInterval: DurationInput
): Layer.Layer<never> =>
  Layer.effectDiscard(
    Effect.gen(function* (_) {
      const memoryData = yield* _(Effect.sync(() => process.memoryUsage()))

      const memoryUsage = {
        rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
        heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
        heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
        external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
      }

      yield* _(Effect.logInfo('Memory usage', memoryUsage))
    }).pipe(
      Effect.zipLeft(Effect.sleep(logInterval)),
      Effect.forever,
      Effect.fork
    )
  )
