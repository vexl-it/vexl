import {
  type MessageType,
  type MessageTypeBackwardCompatible,
} from '@vexl-next/domain/src/general/messaging'

export default function mapMessageTypeToBackwardCompatibleMessageType(
  messageType: MessageType
): MessageTypeBackwardCompatible {
  switch (messageType) {
    case 'REQUEST_MESSAGING':
      return 'REQUEST_MESSAGING'
    case 'APPROVE_MESSAGING':
      return 'APPROVE_MESSAGING'
    case 'DISAPPROVE_MESSAGING':
      return 'DISAPPROVE_MESSAGING'
    case 'APPROVE_REVEAL':
      return 'APPROVE_REVEAL'
    case 'REQUEST_REVEAL':
      return 'REQUEST_REVEAL'
    case 'DISAPPROVE_REVEAL':
      return 'DISAPPROVE_REVEAL'
    case 'BLOCK_CHAT':
      return 'BLOCK_CHAT'
    case 'DELETE_CHAT':
      return 'DELETE_CHAT'
    default:
      return 'MESSAGE'
  }
}
