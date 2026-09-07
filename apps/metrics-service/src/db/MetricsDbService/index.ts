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
} from './queries/createInsertMetricRecord'
import {createQueryAllLastReportedByService} from './queries/createQueryAllLastReportedByService'

export interface MetricsDbOperations {
  insertMetricRecord: (
    record: InsertMetricsParams
  ) => Effect.Effect<void, UnexpectedServerError>

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

export class MetricsDbService extends Context.Service<
  MetricsDbService,
  MetricsDbOperations
>()('MetricsDbService') {
  static readonly Live = Layer.effect(
    MetricsDbService,
    Effect.gen(function* () {
      const insertMetricRecord = yield* createInsertMetricRecord
      const insertDeadMetricRecord = yield* createInsertDeadMetricRecord
      const insertLastReportedByService =
        yield* createInsertLastReportedByService
      const queryAllLastReportedByService =
        yield* createQueryAllLastReportedByService
      return {
        insertMetricRecord,
        insertDeadMetricRecord,
        insertLastReportedByService,
        queryAllLastReportedByService,
      }
    })
  )
}
