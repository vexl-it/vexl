import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import type * as TO from 'fp-ts/TaskOption'

export type providerNotificationServerPublicKey =
  () => TO.TaskOption<PublicKeyPemBase64>

export const CHAT_PLACEHOLDER_NOTIFICATION_TYPE = 'CHAT_PLACEHOLDER'
