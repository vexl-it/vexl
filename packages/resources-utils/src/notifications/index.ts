import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import type * as TO from 'fp-ts/TaskOption'

export type providerNotificationServerPublicKey =
  () => TO.TaskOption<PublicKeyPemBase64>
