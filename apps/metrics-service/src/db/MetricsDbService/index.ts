import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {
  createInsertDeadMetricRecord,
  type InsertDeadMetricsParams,
} from './queries/createInsertDeadMetricRecord'
import {
  createInsertMetricRecord,
  type InsertMetricsParams,
  type MessageWithUuidAlreadyStoredError,
} from './queries/createInsertMetricRecord'

export interface MetricsDbOperations {
  insertMetricRecord: (
    record: InsertMetricsParams
  ) => Effect.Effect<
    void,
    UnexpectedServerError | MessageWithUuidAlreadyStoredError
  >

  insertDeadMetricRecord: (
    record: InsertDeadMetricsParams
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class MetricsDbService extends Context.Tag('MetricsDbService')<
  MetricsDbService,
  MetricsDbOperations
>() {
  static readonly Live = Layer.effect(
    MetricsDbService,
    Effect.gen(function* (_) {
      const insertMetricRecord = yield* _(createInsertMetricRecord)
      const insertDeadMetricRecord = yield* _(createInsertDeadMetricRecord)
      return {
        insertMetricRecord,
        insertDeadMetricRecord,
      }
    })
  )
}
