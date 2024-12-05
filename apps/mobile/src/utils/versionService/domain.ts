import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {z} from 'zod'

export const VersionServiceState = z
  .object({
    requestForceUpdate: z.boolean(),
    offerRerequestLimitDays: z.number().int().min(0),
    maintenanceUntil: z
      .object({
        start: UnixMilliseconds,
        end: UnixMilliseconds,
      })
      .optional(),
  })
  .readonly()
export type VersionServiceState = z.TypeOf<typeof VersionServiceState>

export const VERSION_SERVICE_STATE_DEFAULT_VALUE: VersionServiceState = {
  requestForceUpdate: false,
  offerRerequestLimitDays: 2,
}
