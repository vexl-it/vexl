import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const MetricRecordId = Schema.BigInt.pipe(Schema.brand('MetricRecordId'))
export type MetricRecordId = typeof MetricRecordId.Type

export class MetricRecord extends Schema.Class<MetricRecord>('MetricRecord')({
  id: MetricRecordId,
  uuid: Uuid,
  name: Schema.String,
  value: Schema.Int,
  timestamp: Schema.DateFromSelf,
  type: Schema.Literal('Increment', 'Total'),
  attributes: Schema.optional(
    Schema.parseJson(
      Schema.Record({
        key: Schema.String,
        value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
      })
    )
  ),
}) {}

export class DeadMetricRecord extends Schema.Class<DeadMetricRecord>(
  'DeadMetricRecord'
)({
  id: Schema.BigInt,
  data: Schema.parseJson(Schema.Unknown),
  message: Schema.String,
  accepted_at: Schema.DateFromSelf,
}) {}

export const LastReportedByServiceId = Schema.BigInt.pipe(
  Schema.brand('LastReportedByServiceId')
)
export type LastReportedByServiceId = typeof LastReportedByServiceId.Type
export class LastReportedByServiceRecord extends Schema.Class<LastReportedByServiceRecord>(
  'LastReportedByService'
)({
  id: LastReportedByServiceId,
  lastEventAt: Schema.DateFromSelf,
  serviceName: Schema.String,
}) {}
