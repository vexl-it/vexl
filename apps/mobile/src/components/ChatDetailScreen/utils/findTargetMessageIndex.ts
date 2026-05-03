import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {type MessagesListItem} from '../components/MessageItem'

type NonMessageListItemType = Exclude<MessagesListItem['type'], 'message'>

export type TargetMessageIndexListItem =
  | {
      type: NonMessageListItemType
    }
  | {
      type: 'message'
      message: {
        message: {
          uuid: ChatMessageId
        }
      }
    }

export default function findTargetMessageIndex({
  messagesList,
  targetMessageId,
}: {
  messagesList: readonly TargetMessageIndexListItem[]
  targetMessageId: ChatMessageId
}): number | undefined {
  for (let index = 0; index < messagesList.length; index++) {
    const item = messagesList[index]
    if (!item) continue
    if (item.type !== 'message') continue
    if (item.message.message.uuid !== targetMessageId) continue

    return index
  }

  return undefined
}
