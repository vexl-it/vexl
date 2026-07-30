import {type ChatOrigin} from '@vexl-next/domain/src/general/messaging'

export default function isNoteChatOrigin(
  origin: ChatOrigin
): origin is Extract<ChatOrigin, {type: 'myNote' | 'theirNote'}> {
  return origin.type === 'myNote' || origin.type === 'theirNote'
}
