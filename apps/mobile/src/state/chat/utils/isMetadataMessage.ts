import {Array} from 'effect'
import {type ChatMessageWithState} from '../domain'

type MessageTypeInState = ChatMessageWithState['message']['messageType']

// Silent messages that update chat metadata and are never shown in the chat.
const metadataMessageTypes: readonly MessageTypeInState[] = [
  'VERSION_UPDATE',
  'FCM_CYPHER_UPDATE',
  'MESSAGE_READ',
  'REQUEST_HISTORY',
  'HISTORY',
]

export function isMetadataMessageType(
  messageType: MessageTypeInState
): boolean {
  return Array.contains(metadataMessageTypes, messageType)
}

export function isHiddenMetadataMessage(
  message: ChatMessageWithState
): boolean {
  return (
    isMetadataMessageType(message.message.messageType) &&
    (message.state === 'receivedButRequiresNewerVersion' ||
      !message.message.forceShow)
  )
}
