import {
  DEFAULT_QUICK_CONNECT_PING_COOLDOWN_STEPS_MINUTES,
  GetVersionServiceInfoResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Option} from 'effect/index'

export const VersionServiceState = GetVersionServiceInfoResponse
export type VersionServiceState = typeof VersionServiceState.Type

export const VERSION_SERVICE_STATE_DEFAULT_VALUE: VersionServiceState = {
  requestForceUpdate: false,
  offerRerequestLimitDays: 2,
  maintenanceUntil: Option.none(),
  backupEnabled: false,
  quickConnectPingCooldownStepsMinutes:
    DEFAULT_QUICK_CONNECT_PING_COOLDOWN_STEPS_MINUTES,
}
