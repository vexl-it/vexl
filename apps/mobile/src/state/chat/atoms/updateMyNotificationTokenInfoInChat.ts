import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ChatWithMessages} from '../domain'

export function updateMyNotificationTokenInfoInChat(
  myNotificationTokenInfo?: VexlNotificationToken
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    chat: {
      ...chat.chat,
      lastReportedVexlToken: myNotificationTokenInfo,
    },
  })
}
