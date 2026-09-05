import {Schema} from 'effect/index'

export const VEXL_TOKEN_PREFIX = 'vexl_nt_'

export const VexlNotificationToken = Schema.String.pipe(
  Schema.brand('VexlNotificationToken'),
  Schema.filter((one) => one.startsWith(VEXL_TOKEN_PREFIX), {
    description: 'VexlNotificationToken must start with valid prefix',
  })
)

export type VexlNotificationToken = typeof VexlNotificationToken.Type

export const VEXL_NOTIFICATION_TOKEN_SECRET_PREFIX = 'vexl_nt_secret_'
export const VexlNotificationTokenSecret = Schema.String.pipe(
  Schema.brand('VexlNotificationTokenSecret'),
  Schema.filter(
    (one) => one.startsWith(VEXL_NOTIFICATION_TOKEN_SECRET_PREFIX),
    {
      description: 'VexlNotificationTokenSecret must start with valid prefix',
    }
  )
)
export type VexlNotificationTokenSecret =
  typeof VexlNotificationTokenSecret.Type

export const isVexlNotificationToken = (
  token: unknown
): token is VexlNotificationToken => Schema.is(VexlNotificationToken)(token)

export const isVexlNotificationTokenSecret = (
  token: unknown
): token is VexlNotificationTokenSecret =>
  Schema.is(VexlNotificationTokenSecret)(token)
