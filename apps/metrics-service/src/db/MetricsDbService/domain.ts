import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const MetricRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('MetricRecordId')
)
export type MetricRecordId = typeof MetricRecordId.Type

export class MetricRecord extends Schema.Class<MetricRecord>('MetricRecord')({
  id: MetricRecordId,
  uuid: Uuid,
  name: Schema.String,
  value: Schema.Int,
  timestamp: Schema.Date,
  type: Schema.Literals(['Increment', 'Total']),
  attributes: Schema.optional(
    Schema.fromJsonString(
      Schema.Record(
        Schema.String,
        Schema.Union([Schema.String, Schema.Number, Schema.Boolean])
      )
    )
  ),
}) {}

export class DeadMetricRecord extends Schema.Class<DeadMetricRecord>(
  'DeadMetricRecord'
)({
  id: Schema.BigIntFromString,
  data: Schema.fromJsonString(Schema.Unknown),
  message: Schema.String,
  accepted_at: Schema.Date,
}) {}

export const LastReportedByServiceId = Schema.BigIntFromString.pipe(
  Schema.brand('LastReportedByServiceId')
)
export type LastReportedByServiceId = typeof LastReportedByServiceId.Type
export class LastReportedByServiceRecord extends Schema.Class<LastReportedByServiceRecord>(
  'LastReportedByService'
)({
  id: LastReportedByServiceId,
  lastEventAt: Schema.Date,
  serviceName: Schema.String,
}) {}
