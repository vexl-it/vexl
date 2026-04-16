import {Array, Option, pipe} from 'effect'
import {type ChatMessageWithState} from '../../../state/chat/domain'

const isContactApproveRevealMessage = (
  message: ChatMessageWithState
): boolean => {
  const chatMessage = message.message

  if (chatMessage.messageType === 'APPROVE_CONTACT_REVEAL') return true

  if (chatMessage.messageType !== 'TRADE_CHECKLIST_UPDATE') return false
  return chatMessage.tradeChecklistUpdate?.contact?.status === 'APPROVE_REVEAL'
}

const isIdentityMessage = (message: ChatMessageWithState): boolean => {
  const chatMessage = message.message

  if (
    chatMessage.messageType === 'REQUEST_REVEAL' ||
    chatMessage.messageType === 'APPROVE_REVEAL' ||
    chatMessage.messageType === 'DISAPPROVE_REVEAL'
  ) {
    return true
  }

  if (chatMessage.messageType !== 'TRADE_CHECKLIST_UPDATE') return false

  return (
    chatMessage.tradeChecklistUpdate?.identity?.status === 'REQUEST_REVEAL' ||
    chatMessage.tradeChecklistUpdate?.identity?.status === 'APPROVE_REVEAL' ||
    chatMessage.tradeChecklistUpdate?.identity?.status === 'DISAPPROVE_REVEAL'
  )
}

const isContactMessage = (message: ChatMessageWithState): boolean => {
  const chatMessage = message.message

  if (
    chatMessage.messageType === 'REQUEST_CONTACT_REVEAL' ||
    chatMessage.messageType === 'APPROVE_CONTACT_REVEAL' ||
    chatMessage.messageType === 'DISAPPROVE_CONTACT_REVEAL'
  ) {
    return true
  }

  if (chatMessage.messageType !== 'TRADE_CHECKLIST_UPDATE') return false

  return (
    chatMessage.tradeChecklistUpdate?.contact?.status === 'REQUEST_REVEAL' ||
    chatMessage.tradeChecklistUpdate?.contact?.status === 'APPROVE_REVEAL' ||
    chatMessage.tradeChecklistUpdate?.contact?.status === 'DISAPPROVE_REVEAL'
  )
}

const isIdentityOrContactRevealMessage = (
  message: ChatMessageWithState
): boolean => {
  return isIdentityMessage(message) || isContactMessage(message)
}

export default function filterIrrelevantIdentityOrContactMessages(
  messages: ChatMessageWithState[]
): (message: ChatMessageWithState) => boolean {
  const latestIdentityMessage = pipe(
    messages,
    Array.findLast(isIdentityMessage),
    Option.getOrUndefined
  )

  const latestContactMessage = pipe(
    messages,
    Array.findLast(isContactMessage),
    Option.getOrUndefined
  )

  if (latestContactMessage) {
    if (isContactApproveRevealMessage(latestContactMessage))
      // Show only last contact approve reveal message. This is because once contact is revealed, previous messages related to contact reveal become irrelevant
      return (message: ChatMessageWithState) =>
        !isIdentityOrContactRevealMessage(message) ||
        message.message.uuid === latestContactMessage.message.uuid

    // Hide all contact reveal related messages if latest contact reveal message is not an approve message
    return (message: ChatMessageWithState) =>
      !isContactMessage(message) ||
      message.message.uuid === latestContactMessage.message.uuid
  }

  if (latestIdentityMessage) {
    // In this case show only latest identity message.
    return (message: ChatMessageWithState) =>
      !isIdentityMessage(message) ||
      message.message.uuid === latestIdentityMessage.message.uuid
  }

  return (message: ChatMessageWithState) => true
}
