import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {
  type AnalyticsStateConflictError,
  type LastReportedByServiceRecord,
} from './domain'
import {
  createDeleteExpiredAnalyticsStates,
  type DeleteExpiredAnalyticsStatesParams,
} from './queries/createDeleteExpiredAnalyticsStates'
import {
  createExpireAnalyticsStateIds,
  type ExpireAnalyticsStateIdsParams,
} from './queries/createExpireAnalyticsStateIds'
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
import {
  createUpsertAnalyticsState,
  type UpsertAnalyticsStateParams,
} from './queries/createUpsertAnalyticsState'

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

  upsertAnalyticsState: (
    params: UpsertAnalyticsStateParams
  ) => Effect.Effect<void, UnexpectedServerError | AnalyticsStateConflictError>

  expireAnalyticsStateIds: (
    params: ExpireAnalyticsStateIdsParams
  ) => Effect.Effect<number, UnexpectedServerError>

  deleteExpiredAnalyticsStates: (
    params: DeleteExpiredAnalyticsStatesParams
  ) => Effect.Effect<number, UnexpectedServerError>
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
      const upsertAnalyticsState = yield* _(createUpsertAnalyticsState)
      const expireAnalyticsStateIds = yield* _(createExpireAnalyticsStateIds)
      const deleteExpiredAnalyticsStates = yield* _(
        createDeleteExpiredAnalyticsStates
      )
      return {
        insertMetricRecord,
        insertDeadMetricRecord,
        insertLastReportedByService,
        queryAllLastReportedByService,
        upsertAnalyticsState,
        expireAnalyticsStateIds,
        deleteExpiredAnalyticsStates,
      }
    })
  )
}
