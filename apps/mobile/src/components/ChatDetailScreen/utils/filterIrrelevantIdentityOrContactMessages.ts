import {Array, Option, pipe} from 'effect'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {type TradeChecklistInState} from '../../../state/tradeChecklist/domain'
import getIdentityRevealStatus from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'

const bothSidesSharedPhoneNumbers = (
  contact: TradeChecklistInState['contact']
): boolean => {
  return !!contact.sent?.fullPhoneNumber && !!contact.received?.fullPhoneNumber
}

const isContactApproveRevealMessage = (
  message: ChatMessageWithState
): boolean => {
  const chatMessage = message.message

  if (chatMessage.messageType === 'APPROVE_CONTACT_REVEAL') return true

  if (chatMessage.messageType !== 'TRADE_CHECKLIST_UPDATE') return false
  return chatMessage.tradeChecklistUpdate?.contact?.status === 'APPROVE_REVEAL'
}

const isContactRequestRevealMessage = (
  message: ChatMessageWithState
): boolean => {
  const chatMessage = message.message

  if (chatMessage.messageType === 'REQUEST_CONTACT_REVEAL') return true

  if (chatMessage.messageType !== 'TRADE_CHECKLIST_UPDATE') return false
  return chatMessage.tradeChecklistUpdate?.contact?.status === 'REQUEST_REVEAL'
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

const identityShared = (
  messages: ChatMessageWithState[],
  tradeChecklist: TradeChecklistInState
): boolean => {
  return getIdentityRevealStatus({messages, tradeChecklist}) === 'shared'
}

export default function filterIrrelevantIdentityOrContactMessages(
  messages: ChatMessageWithState[],
  tradeChecklist: TradeChecklistInState
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

  if (latestIdentityMessage && !identityShared(messages, tradeChecklist)) {
    // Phone reveal is dependent on identity reveal. If both are requested at
    // once, keep the identity action visible and hide the phone action.
    return (message: ChatMessageWithState) =>
      !isIdentityOrContactRevealMessage(message) ||
      message.message.uuid === latestIdentityMessage.message.uuid
  }

  if (
    latestIdentityMessage &&
    latestContactMessage &&
    isContactRequestRevealMessage(latestContactMessage) &&
    latestContactMessage.message.time <= latestIdentityMessage.message.time
  ) {
    // The phone request was sent together with/before identity reveal. Once
    // identity is revealed, the follow-up phone action is rendered under the
    // identity reveal card instead of as its own older bot message.
    return (message: ChatMessageWithState) =>
      !isIdentityOrContactRevealMessage(message) ||
      message.message.uuid === latestIdentityMessage.message.uuid
  }

  if (latestContactMessage) {
    if (
      isContactApproveRevealMessage(latestContactMessage) &&
      bothSidesSharedPhoneNumbers(tradeChecklist.contact)
    )
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
