import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import addToSortedArray from '../../../utils/addToSortedArray'

export interface MessageWithState {
  type: 'message'
  message: ChatMessageWithState
}

export function getTime(message: MessageWithState): UnixMilliseconds {
  return message.message.message.time
}

export function getUniqueKey(message: MessageWithState): string {
  return message.message.message.uuid
}

export function getMessageTime(message: MessageWithState): UnixMilliseconds {
  return message.message.message.time
}

export function addVexlBotOrMessageWithStateToArray(
  item: MessageWithState
): (args: MessageWithState[]) => MessageWithState[] {
  return (items) =>
    addToSortedArray(items, (a, b) => {
      const aMillis = getMessageTime(a)
      const bMillis = getMessageTime(b)
      return aMillis - bMillis
    })(item)
}
