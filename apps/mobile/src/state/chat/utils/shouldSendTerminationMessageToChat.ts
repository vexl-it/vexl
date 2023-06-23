import {type ChatWithMessages} from '../domain'

export default function shouldSendTerminationMessageToChat({
  messages,
}: ChatWithMessages): boolean {
  return (
    messages.length !== 0 &&
    ![
      'DELETE_CHAT', // Other user has deleted the chat as a last message. We don't want to send them another notification
      'BLOCK_CHAT', // Other user has blocked us. There is no point of sending them a message. It will fail
      'REQUEST_MESSAGING', // We have not yet received permission for messaging. Messaging will fail
      'INBOX_DELETED', // Inbox has been deleted. Messaging will fail
      'CANCEL_REQUEST_MESSAGING', // Inbox has been deleted. Messaging will fail
    ].includes(messages.at(-1)?.message.messageType ?? '')
  )
}
