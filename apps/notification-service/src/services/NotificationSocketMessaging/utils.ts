import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type NotificationConnectionKind} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {type SendMessageTask} from './domain'

// Stream-only chat messages (typing indicators) are meaningless without the UI
// open, so they never wake a background socket.
export const canDeliverTaskToConnection = (
  task: SendMessageTask,
  clientInfo: {
    readonly connectionKind: NotificationConnectionKind
    readonly version: VersionCode
  }
): boolean =>
  clientInfo.version >= (task.minimalClientVersion ?? 0) &&
  (task._tag !== 'StreamOnlyChatMessageSendTask' ||
    clientInfo.connectionKind === 'foreground')
