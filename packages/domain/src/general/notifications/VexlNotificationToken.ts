import {Schema} from 'effect/index'

// TODO remove temporary tokens #2124

export const VEXL_TOKEN_PREFIX = 'vexl_nt_'

export const VexlNotificationToken = Schema.String.pipe(
  Schema.brand('VexlNotificationToken'),
  Schema.filter((one) => one.startsWith(VEXL_TOKEN_PREFIX), {
    description:
      'VexlNotificationToken must start with valid prefix (temporary or permanent)',
  })
)

export type VexlNotificationToken = typeof VexlNotificationToken.Type

export const VEXL_NOTIFICATION_TOKEN_SECRET_PREFIX = 'vexl_nt_secret_'
export const VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX =
  'temp_vexl_nt_secret_'
export const VexlNotificationTokenSecret = Schema.String.pipe(
  Schema.brand('VexlNotificationTokenSecret'),
  Schema.filter(
    (one) =>
      one.startsWith(VEXL_NOTIFICATION_TOKEN_SECRET_PREFIX) ||
      one.startsWith(VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX),
    {
      description: 'VexlNotificationTokenSecret must start with valid prefix',
    }
  )
)
export const VexlNotificationTokenSecretNotTemporary =
  VexlNotificationTokenSecret.pipe(
    Schema.filter(
      (one) => !one.startsWith(VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX),
      {
        description:
          'VexlNotificationTokenSecretNotTemporary must start with permanent prefix',
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
