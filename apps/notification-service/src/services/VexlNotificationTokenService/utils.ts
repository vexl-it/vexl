import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Option, Schema} from 'effect/index'

const TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX = 'temp_vexl_nt_'
export const createTemporaryVexlNotificationToken = (
  expoToken: ExpoNotificationToken
): VexlNotificationToken => {
  return Schema.decodeSync(VexlNotificationToken)(
    `${TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX}${expoToken}`
  )
}

export const getExpoTokenFromTemporaryVexlNotificationToken = (
  vexlToken: VexlNotificationToken
): Option.Option<ExpoNotificationToken> => {
  if (vexlToken.startsWith(TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX)) {
    return Option.some(
      vexlToken.slice(
        TEMPORARAY_VEXL_NOTIFICATION_TOKEN_PREFIX.length
      ) as ExpoNotificationToken
    )
  }
  return Option.none()
}
