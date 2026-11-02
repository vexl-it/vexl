import {type ChatMessageWithState} from '../domain'

const METADATA_ONLY_MESSAGE_TYPES = new Set<string>([
  'VERSION_UPDATE',
  'FCM_CYPHER_UPDATE',
  'MESSAGE_READ',
  'REACTION',
])

/**
 * Metadata-only messages update chat state but are never shown in the chat,
 * don't mark it unread and don't reset the read receipt.
 */
export default function isMetadataOnlyMessage(
  message: ChatMessageWithState
): boolean {
  return METADATA_ONLY_MESSAGE_TYPES.has(message.message.messageType)
}
