import {type ChatWithMessages} from '../domain'

const closingMessageTypes = [
  'DISAPPROVE_MESSAGING',
  'CANCEL_REQUEST_MESSAGING',
  'DELETE_CHAT',
  'BLOCK_CHAT',
  'INBOX_DELETED',
]

const openingMessageTypes = ['APPROVE_MESSAGING']

const significantMessageTypes = [...closingMessageTypes, ...openingMessageTypes]

export default function isChatOpen(chat: ChatWithMessages): boolean {
  const significantMessageType = [
    ...chat.messages.map((one) => one.message.messageType),
  ]
    .reverse()
    .find((messageType) => significantMessageTypes.includes(messageType))

  return significantMessageType === 'APPROVE_MESSAGING'
}
