import {DateTime} from 'luxon'
import {z} from 'zod'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

export const MaintenanceConfig = z.object({
  from: IsoDatetimeString,
  to: IsoDatetimeString,
})

export const NextForceUpdateType = z
  .number()
  .int()
  .min(0)
  .brand<'nextForceUpdateTyoe'>()

export const RemoteConfig = z.object({
  next__force_update: NextForceUpdateType,
  next__maintenance: MaintenanceConfig,
})
export type RemoteConfig = z.TypeOf<typeof RemoteConfig>

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  next__force_update: NextForceUpdateType.parse(0),
  next__maintenance: {
    from: IsoDatetimeString.parse(DateTime.fromMillis(0).toISO()),
    to: IsoDatetimeString.parse(DateTime.fromMillis(0).toISO()),
  },
}
