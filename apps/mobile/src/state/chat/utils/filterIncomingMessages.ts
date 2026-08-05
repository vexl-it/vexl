import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Array, Option, pipe} from 'effect'
import {type BlockedChatSender} from '../blockedChatSender'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import compareMessages from './compareMessages'
import {
  getChatState,
  isRerequestCooldownElapsed,
  type ChatState,
} from './offerStates'

type IncomingMessageType =
  | ChatMessageWithState['message']['messageType']
  | 'STREAM_ONLY'

interface SenderFilterState {
  readonly senderPublicKey: PublicKeyPemBase64
  readonly chatState: ChatState | undefined
  readonly lastTerminalMessage: ChatMessageWithState | undefined
}

const terminalChatStates: readonly ChatState[] = [
  'requestDeniedByThem',
  'requestDeniedByMe',
  'requestCancelledByMe',
  'requestCancelledByThem',
  'chatClosed',
]

function isBlocked({
  inboxPublicKey,
  senderPublicKey,
  blockedSenders,
}: {
  inboxPublicKey: PublicKeyPemBase64
  senderPublicKey: PublicKeyPemBase64
  blockedSenders: readonly BlockedChatSender[]
}): boolean {
  return Array.some(
    blockedSenders,
    (entry) =>
      entry.inboxPublicKey === inboxPublicKey &&
      entry.blockedSenderPublicKey === senderPublicKey
  )
}

function findLastTerminalMessage(
  chat: ChatWithMessages | undefined
): ChatMessageWithState | undefined {
  return pipe(
    chat?.messages ?? [],
    Array.findLast(
      (message) =>
        message.message.messageType === 'DISAPPROVE_MESSAGING' ||
        message.message.messageType === 'CANCEL_REQUEST_MESSAGING' ||
        message.message.messageType === 'DELETE_CHAT'
    ),
    Option.getOrUndefined
  )
}

function shouldAcceptForState({
  messageType,
  incomingMessage,
  state,
  rerequestLimitDays,
}: {
  messageType: IncomingMessageType
  incomingMessage: ChatMessageWithState | undefined
  state: SenderFilterState
  rerequestLimitDays: number
}): boolean {
  if (!state.chatState) {
    return (
      messageType === 'REQUEST_MESSAGING' ||
      incomingMessage?.state === 'receivedButRequiresNewerVersion'
    )
  }

  // Messages from newer protocol versions cannot be inspected, but in pending
  // states they may carry a legitimate handshake step (approval, cancellation)
  // that would otherwise be lost forever - accept them and let the placeholder
  // UI ask the user to update.
  if (state.chatState === 'requestedByThem') {
    return (
      messageType === 'CANCEL_REQUEST_MESSAGING' ||
      incomingMessage?.state === 'receivedButRequiresNewerVersion'
    )
  }

  if (state.chatState === 'requestedByMe') {
    return (
      messageType === 'APPROVE_MESSAGING' ||
      messageType === 'DISAPPROVE_MESSAGING' ||
      incomingMessage?.state === 'receivedButRequiresNewerVersion'
    )
  }

  if (
    Array.some(
      terminalChatStates,
      (terminalState) => terminalState === state.chatState
    )
  ) {
    if (
      messageType !== 'REQUEST_MESSAGING' ||
      !incomingMessage ||
      !state.lastTerminalMessage
    ) {
      return false
    }

    return isRerequestCooldownElapsed({
      earlierAt:
        state.lastTerminalMessage.receivedByServerAt ??
        state.lastTerminalMessage.message.time,
      laterAt:
        incomingMessage.receivedByServerAt ?? incomingMessage.message.time,
      limitDays: rerequestLimitDays,
    })
  }

  return (
    messageType !== 'REQUEST_MESSAGING' &&
    messageType !== 'APPROVE_MESSAGING' &&
    messageType !== 'DISAPPROVE_MESSAGING' &&
    messageType !== 'CANCEL_REQUEST_MESSAGING'
  )
}

function getInitialSenderState(
  inbox: InboxInState,
  senderPublicKey: PublicKeyPemBase64
): SenderFilterState {
  const chat = pipe(
    inbox.chats,
    Array.findFirst(
      (chat) => chat.chat.otherSide.publicKey === senderPublicKey
    ),
    Option.getOrUndefined
  )

  return {
    senderPublicKey,
    chatState: chat ? getChatState(chat) : undefined,
    lastTerminalMessage: findLastTerminalMessage(chat),
  }
}

function updateSenderState(
  state: SenderFilterState,
  message: ChatMessageWithState
): SenderFilterState {
  if (message.state === 'receivedButRequiresNewerVersion') {
    return state.chatState ? state : {...state, chatState: 'requestedByThem'}
  }

  switch (message.message.messageType) {
    case 'REQUEST_MESSAGING':
      return {...state, chatState: 'requestedByThem'}
    case 'APPROVE_MESSAGING':
      return {...state, chatState: 'chatOpen'}
    case 'DISAPPROVE_MESSAGING':
      return {
        ...state,
        chatState: 'requestDeniedByThem',
        lastTerminalMessage: message,
      }
    case 'CANCEL_REQUEST_MESSAGING':
      return {
        ...state,
        chatState: 'requestCancelledByThem',
        lastTerminalMessage: message,
      }
    case 'DELETE_CHAT':
      return {
        ...state,
        chatState: 'chatClosed',
        lastTerminalMessage: message,
      }
    case 'BLOCK_CHAT':
    case 'INBOX_DELETED':
      return {...state, chatState: 'chatClosed'}
    default:
      return state
  }
}

export function filterIncomingMessages({
  inbox,
  messages,
  blockedSenders,
  rerequestLimitDays,
}: {
  inbox: InboxInState
  messages: readonly ChatMessageWithState[]
  blockedSenders: readonly BlockedChatSender[]
  rerequestLimitDays: number
}): ChatMessageWithState[] {
  const initial: {
    accepted: ChatMessageWithState[]
    senderStates: SenderFilterState[]
  } = {
    accepted: [],
    senderStates: [],
  }

  return Array.reduce(
    Array.sort(messages, compareMessages),
    initial,
    (accumulator, message) => {
      const senderPublicKey = message.message.senderPublicKey
      if (
        isBlocked({
          inboxPublicKey: inbox.inbox.privateKey.publicKeyPemBase64,
          senderPublicKey,
          blockedSenders,
        })
      ) {
        return accumulator
      }

      const existingStateIndex = Array.findFirstIndex(
        accumulator.senderStates,
        (state) => state.senderPublicKey === senderPublicKey
      )
      const state = pipe(
        existingStateIndex,
        Option.flatMap((index) => Array.get(accumulator.senderStates, index)),
        Option.getOrElse(() => getInitialSenderState(inbox, senderPublicKey))
      )

      if (
        !shouldAcceptForState({
          messageType: message.message.messageType,
          incomingMessage: message,
          state,
          rerequestLimitDays,
        })
      ) {
        return accumulator
      }

      const nextState = updateSenderState(state, message)
      return {
        accepted: [...accumulator.accepted, message],
        senderStates: Option.match(existingStateIndex, {
          onNone: () => [...accumulator.senderStates, nextState],
          onSome: (index) =>
            Array.replace(accumulator.senderStates, index, nextState),
        }),
      }
    }
  ).accepted
}

export function shouldAcceptIncomingStreamOnlyMessage({
  inbox,
  senderPublicKey,
  blockedSenders,
}: {
  inbox: InboxInState
  senderPublicKey: PublicKeyPemBase64
  blockedSenders: readonly BlockedChatSender[]
}): boolean {
  if (
    isBlocked({
      inboxPublicKey: inbox.inbox.privateKey.publicKeyPemBase64,
      senderPublicKey,
      blockedSenders,
    })
  ) {
    return false
  }

  return shouldAcceptForState({
    messageType: 'STREAM_ONLY',
    incomingMessage: undefined,
    state: getInitialSenderState(inbox, senderPublicKey),
    rerequestLimitDays: 0,
  })
}
