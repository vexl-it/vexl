import {Schema} from 'effect/index'

// TODO remove temporary tokens #2124

export const TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX = 'temp_vexl_nt_'
export const VEXL_TOKEN_PREFIX = 'vexl_nt_'

export const VexlNotificationToken = Schema.String.pipe(
  Schema.brand('VexlNotificationToken'),
  Schema.filter(
    (one) =>
      one.startsWith(TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX) ||
      one.startsWith(VEXL_TOKEN_PREFIX),
    {
      description:
        'VexlNotificationToken must start with valid prefix (temporary or permanent)',
    }
  )
)
export const VexlNotificationTokenNotTemporary = VexlNotificationToken.pipe(
  Schema.filter(
    (one) => !one.startsWith(TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX),
    {
      description: 'Temporary VexlNotificationToken is not allowed',
    }
  )
)
export type VexlNotificationToken = typeof VexlNotificationToken.Type

export const VexlNotificationTokenSecret = Schema.String.pipe(
  Schema.brand('VexlNotificationTokenSecret')
)
export type VexlNotificationTokenSecret =
  typeof VexlNotificationTokenSecret.Type

export const isVexlNotificationToken = (
  token: string
): token is VexlNotificationToken => Schema.is(VexlNotificationToken)(token)
