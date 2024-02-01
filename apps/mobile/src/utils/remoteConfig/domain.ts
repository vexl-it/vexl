import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {z} from 'zod'
import unixMillisecondsToLocaleDateTime from '../unixMillisecondsToLocaleDateTime'

export const MaintenanceConfig = z.object({
  from: IsoDatetimeString,
  to: IsoDatetimeString,
})

export const NextForceUpdate = z
  .number()
  .int()
  .min(0)
  .brand<'NextForceUpdateType'>()

export const OfferRerequestLimitDays = z
  .number()
  .int()
  .min(0)
  .brand<'OfferRerequestLimitType'>()
export type OfferRerequestLimitDays = z.TypeOf<typeof OfferRerequestLimitDays>

export const RemoteConfig = z.object({
  next__force_update: NextForceUpdate,
  next__maintenance: MaintenanceConfig,
  next__offer_rerequest_limit_days: OfferRerequestLimitDays,
})
export type RemoteConfig = z.TypeOf<typeof RemoteConfig>

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  next__force_update: NextForceUpdate.parse(0),
  next__maintenance: {
    from: IsoDatetimeString.parse(
      unixMillisecondsToLocaleDateTime(UnixMilliseconds0).toISO()
    ),
    to: IsoDatetimeString.parse(
      unixMillisecondsToLocaleDateTime(UnixMilliseconds0).toISO()
    ),
  },
  next__offer_rerequest_limit_days: OfferRerequestLimitDays.parse(1),
}
