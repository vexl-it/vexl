import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect/index'

export const VersionServiceState = Schema.Struct({
  requestForceUpdate: Schema.Boolean,
  offerRerequestLimitDays: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
  maintenanceUntil: Schema.optionalWith(
    Schema.Struct({
      start: UnixMilliseconds,
      end: UnixMilliseconds,
    }),
    {nullable: true}
  ),
})
export type VersionServiceState = typeof VersionServiceState.Type

export const VERSION_SERVICE_STATE_DEFAULT_VALUE: VersionServiceState = {
  requestForceUpdate: false,
  offerRerequestLimitDays: 2,
  maintenanceUntil: undefined,
}
