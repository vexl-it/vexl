import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  type NotificationConnectionKind,
  NotificationsStreamClientInfo,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {Schema} from 'effect'
import {
  ClientInfo,
  NewChatMessageNoticeSendTask,
  StreamOnlyChatMessageSendTask,
} from '../services/NotificationSocketMessaging/domain'
import {canDeliverTaskToConnection} from '../services/NotificationSocketMessaging/utils'

const noticeTask = Schema.decodeSync(NewChatMessageNoticeSendTask)({
  _tag: 'NewChatMessageNoticeSendTask',
  notificationToken: 'vexl_nt_secret_test',
  sendNewChatMessageNotification: true,
})

const streamOnlyTask = Schema.decodeSync(StreamOnlyChatMessageSendTask)({
  _tag: 'StreamOnlyChatMessageSendTask',
  notificationToken: 'vexl_nt_secret_test',
  message: 'cypher',
})

const clientInfo = (
  connectionKind: NotificationConnectionKind
): {connectionKind: NotificationConnectionKind; version: VersionCode} => ({
  connectionKind,
  version: Schema.decodeSync(VersionCode)(890),
})
const foreground = clientInfo('foreground')
const background = clientInfo('background')

describe('notification connection kind', () => {
  it('decodes old clients without connectionKind as foreground', () => {
    const clientInfo = Schema.decodeSync(NotificationsStreamClientInfo)({
      notificationToken: 'vexl_nt_secret_test',
      version: 890,
      platform: 'ANDROID',
    })

    expect(clientInfo.connectionKind).toBe('foreground')
  })

  it('decodes old Redis connection records as foreground', () => {
    const clientInfo = Schema.decodeSync(ClientInfo)({
      notificationToken: 'vexl_nt_secret_test',
      version: 890,
      platform: 'ANDROID',
    })

    expect(clientInfo.connectionKind).toBe('foreground')
  })

  it('delivers durable notifications to both connection kinds', () => {
    expect(canDeliverTaskToConnection(noticeTask, foreground)).toBe(true)
    expect(canDeliverTaskToConnection(noticeTask, background)).toBe(true)
  })

  it('does not deliver stream-only messages to background connections', () => {
    expect(canDeliverTaskToConnection(streamOnlyTask, foreground)).toBe(true)
    expect(canDeliverTaskToConnection(streamOnlyTask, background)).toBe(false)
  })

  it('does not deliver to connections below the minimal client version', () => {
    const task = Schema.decodeSync(NewChatMessageNoticeSendTask)({
      _tag: 'NewChatMessageNoticeSendTask',
      notificationToken: 'vexl_nt_secret_test',
      sendNewChatMessageNotification: true,
      minimalClientVersion: 900,
    })

    expect(canDeliverTaskToConnection(task, foreground)).toBe(false)
    expect(canDeliverTaskToConnection(task, background)).toBe(false)
  })
})
