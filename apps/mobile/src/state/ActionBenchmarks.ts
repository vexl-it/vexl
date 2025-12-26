import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, Option, Record, Schema} from 'effect/index'
import {pipe} from 'fp-ts/lib/function'
import {atom, getDefaultStore} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'

const BenchmarkRecord = Schema.Struct({
  startedAt: UnixMilliseconds,
  endedAt: UnixMilliseconds,
  description: Schema.optional(Schema.String),
})
const BenchmarkStorage = Schema.Struct({
  enabled: Schema.Boolean,
  benchmarks: Schema.Record({
    key: Schema.String,
    value: Schema.Array(BenchmarkRecord),
  }),
})

const storageAtom = atomWithParsedMmkvStorage(
  'actionsBenchmarks',
  {benchmarks: {}, enabled: false},
  BenchmarkStorage
)

export const benchmarkAtom = focusAtom(storageAtom, (p) => p.prop('benchmarks'))
export const benchmarkArrayAtom = atom((get) => {
  const benchmarksRecord = get(benchmarkAtom)
  return pipe(
    benchmarksRecord,
    Record.toEntries,
    Array.map(([name, records]) => ({
      name,
      records,
    }))
  )
})
export const benchmarkEnabledAtom = focusAtom(storageAtom, (p) =>
  p.prop('enabled')
)

export const addBenchmarkActionAtom = atom(
  null,
  (get, set, params: {name: string; record: typeof BenchmarkRecord.Type}) => {
    if (!get(benchmarkEnabledAtom)) return
    set(benchmarkAtom, (old) => {
      const newRecords = pipe(
        old,
        Record.get(params.name),
        Option.getOrElse(() => []),
        Array.append(params.record)
      )
      return Record.set(params.name, newRecords)(old)
    })
  }
)

export const clearBenchmarksActionAtom = atom(null, (_, set) => {
  set(benchmarkAtom, Record.empty())
})

export const startBenchmark = (name: string): ((d?: string) => void) => {
  const startedAt = unixMillisecondsNow()
  return (description?: string) => {
    const end = unixMillisecondsNow()
    const runTotalSec = Math.floor((end - startedAt) / 1000)
    const runTotalMs = (end - startedAt) % 1000
    console.log(
      `⏲️ ${name} run for ${runTotalSec}s ${runTotalMs}ms. ${description ?? ''}`
    )
    getDefaultStore().set(addBenchmarkActionAtom, {
      name,
      record: {
        startedAt,
        endedAt: unixMillisecondsNow(),
        description,
      },
    })
  }
}

export const effectWithEnsuredBenchmark =
  <A, E, R>(name: string, description?: string) =>
  (e: Effect.Effect<A, E, R>) =>
    Effect.gen(function* (_) {
      const endBenchmark = startBenchmark(name)

      const result = yield* _(
        Effect.ensuring(
          e,
          Effect.sync(() => {
            endBenchmark(description)
          })
        )
      )
      return result
    })
