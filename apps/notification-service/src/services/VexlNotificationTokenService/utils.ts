import {
  VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Option, Schema} from 'effect/index'

export const createTemporaryVexlNotificationTokenSecret = (
  expoToken: ExpoNotificationToken
): VexlNotificationTokenSecret => {
  return Schema.decodeSync(VexlNotificationTokenSecret)(
    `${VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX}${expoToken}`
  )
}

export const getExpoTokenFromTemporaryVexlNotificationToken = (
  vexlToken: VexlNotificationTokenSecret
): Option.Option<ExpoNotificationToken> => {
  if (vexlToken.startsWith(VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX)) {
    return Option.some(
      vexlToken.slice(VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX.length)
    ).pipe(Option.flatMap(Schema.decodeOption(ExpoNotificationToken)))
  }
  return Option.none()
}
