import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {type LastReportedByServiceRecord} from './domain'
import {
  createInsertDeadMetricRecord,
  type InsertDeadMetricsParams,
} from './queries/createInsertDeadMetricRecord'
import {
  createInsertLastReportedByService,
  type InsertLastReportedByServiceParams,
} from './queries/createInsertLastReportedByService'
import {
  createInsertMetricRecord,
  type InsertMetricsParams,
  type MessageWithUuidAlreadyStoredError,
} from './queries/createInsertMetricRecord'
import {createQueryAllLastReportedByService} from './queries/createQueryAllLastReportedByService'

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

  insertLastReportedByService: (
    record: InsertLastReportedByServiceParams
  ) => Effect.Effect<void, UnexpectedServerError>

  queryAllLastReportedByService: () => Effect.Effect<
    readonly LastReportedByServiceRecord[],
    UnexpectedServerError
  >
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
      const insertLastReportedByService = yield* _(
        createInsertLastReportedByService
      )
      const queryAllLastReportedByService = yield* _(
        createQueryAllLastReportedByService
      )
      return {
        insertMetricRecord,
        insertDeadMetricRecord,
        insertLastReportedByService,
        queryAllLastReportedByService,
      }
    })
  )
}
