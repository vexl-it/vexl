import {GetVersionServiceInfoResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {Option} from 'effect/index'

export const VersionServiceState = GetVersionServiceInfoResponse
export type VersionServiceState = typeof VersionServiceState.Type

export const VERSION_SERVICE_STATE_DEFAULT_VALUE: VersionServiceState = {
  requestForceUpdate: false,
  offerRerequestLimitDays: 2,
  maintenanceUntil: Option.none(),
}
