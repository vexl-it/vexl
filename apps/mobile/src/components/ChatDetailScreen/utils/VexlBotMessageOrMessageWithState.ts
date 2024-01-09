import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VexlBotMessageData} from '../components/VexlbotMessageItem/domain'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import addToSortedArray from '../../../utils/addToSortedArray'

export type VexlBotOrMessageWithState =
  | {type: 'vexlBot'; message: VexlBotMessageData}
  | {
      type: 'message'
      message: ChatMessageWithState
    }

export function getTime(message: VexlBotOrMessageWithState): UnixMilliseconds {
  return message.type === 'vexlBot'
    ? message.message.date
    : message.message.message.time
}

export function getUniqueKey(message: VexlBotOrMessageWithState): string {
  return message.type === 'vexlBot'
    ? message.message.type
    : message.message.message.uuid
}

export function getMessageTime(
  message: VexlBotOrMessageWithState
): UnixMilliseconds {
  return message.type === 'vexlBot'
    ? message.message.date
    : message.message.message.time
}

export function addVexlBotOrMessageWithStateToArray(
  item: VexlBotOrMessageWithState
): (args: VexlBotOrMessageWithState[]) => VexlBotOrMessageWithState[] {
  return (items) =>
    addToSortedArray(items, (a, b) => {
      const aMillis = getMessageTime(a)
      const bMillis = getMessageTime(b)
      return aMillis - bMillis
    })(item)
}
