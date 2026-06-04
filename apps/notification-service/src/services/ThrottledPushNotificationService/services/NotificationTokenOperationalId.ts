import {sha256} from '@vexl-next/cryptography/src/operations/sha'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'

const OPERATIONAL_ID_DOMAIN = 'vexl-notification-token-operational-id:v1:'

export const notificationTokenOperationalId = (
  token: VexlNotificationTokenSecret
): string =>
  sha256(`${OPERATIONAL_ID_DOMAIN}${token}`)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
