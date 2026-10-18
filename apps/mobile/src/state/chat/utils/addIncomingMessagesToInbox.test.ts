import {
  generatePrivateKey,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {generateMasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  generateChatId,
  generateChatMessageId,
  type ChatMessage,
  type ChatRecoveryProof,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {createHistoryMessage} from '@vexl-next/resources-utils/src/chat/utils/chatHistory'
import {deriveChatRecoveryProof} from '@vexl-next/resources-utils/src/keyDerivation/keyFactory'
import {Array, HashSet, Schema} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import addIncomingMessagesToInbox from './addIncomingMessagesToInbox'
import {startsChatRecovery} from './chatRecovery'
import {filterIncomingMessages} from './filterIncomingMessages'
import isChatOpen from './isChatOpen'

jest.mock('./scheduleTradeReminderIfNeeded', () => ({
  scheduleTradeReminderIfNeeded: () => (chat: ChatWithMessages) => chat,
}))

jest.mock('../../../utils/localization/I18nProvider', () => ({
  getCurrentLocale: () => 'en-US',
}))

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const version = Schema.decodeSync(VersionString)('26.10.0')
const masterSeed = generateMasterSeed()
const myKey = generatePrivateKey()
const theirKey = generatePrivateKey()
const validProof = deriveChatRecoveryProof(masterSeed, {
  myPublicKey: myKey.publicKeyPemBase64,
  otherSidePublicKey: theirKey.publicKeyPemBase64,
})
const proofForAnotherChat = deriveChatRecoveryProof(masterSeed, {
  myPublicKey: myKey.publicKeyPemBase64,
  otherSidePublicKey: generatePrivateKey().publicKeyPemBase64,
})

function at(day: number): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(Date.UTC(2026, 0, day))
}

function message(
  key: PrivateKeyHolder,
  fields: Partial<ChatMessage> & {time: UnixMilliseconds}
): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    text: 'hello',
    messageType: 'MESSAGE',
    senderPublicKey: key.publicKeyPemBase64,
    ...fields,
  }
}

function received(chatMessage: ChatMessage): ChatMessageWithState {
  return {
    state: 'received',
    message: chatMessage,
    receivedByServerAt: chatMessage.time,
  }
}

// Stands in for createNewChatsFromFirstMessagesActionAtom on a restored inbox
function createNewChats(messages: ChatMessageWithState[]): ChatWithMessages[] {
  return Array.map(Array.take(messages, 1), (first) => ({
    chat: {
      id: generateChatId(),
      inbox: {privateKey: myKey},
      otherSide: {publicKey: first.message.senderPublicKey},
      origin: {type: 'unknown'},
      isUnread: true,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      showVexlbotNotifications: true,
    },
    messages,
    hiddenMessagesIds: HashSet.empty(),
    tradeChecklist: {
      dateAndTime: {},
      location: {},
      amount: {},
      network: {},
      identity: {},
      contact: {},
    },
    feedbackSubmitted: false,
    restoredFromBackup: startsChatRecovery(first),
    recoveryStartedAt: at(4),
  }))
}

const restoredInbox: InboxInState = {
  inbox: {privateKey: myKey},
  chats: [],
  restoredFromBackup: true,
  restoredAt: at(1),
}

function receive(
  inbox: InboxInState,
  messages: ChatMessageWithState[]
): ReturnType<typeof addIncomingMessagesToInbox> {
  return addIncomingMessagesToInbox({
    inbox,
    messages: filterIncomingMessages({
      inbox,
      messages,
      blockedSenders: [],
      rerequestLimitDays: 7,
    }),
    createNewChats,
    expectedRecoveryProof: () => validProof,
  })
}

function history(
  historyRecoveryProof: ChatRecoveryProof | undefined
): ChatMessageWithState {
  const historyMessage = createHistoryMessage({
    senderPublicKey: theirKey.publicKeyPemBase64,
    myVersion: version,
    messages: [
      {
        state: 'sent',
        message: message(theirKey, {time: at(2), text: 'from history'}),
      },
    ],
    historyRecoveryProof: validProof,
  })

  return received({...historyMessage, time: at(6), historyRecoveryProof})
}

const strangerMessage = received(message(theirKey, {time: at(3)}))

function pendingInbox(): InboxInState {
  const {updatedInbox} = receive(restoredInbox, [strangerMessage])
  return {
    ...updatedInbox,
    pendingRecoveryChats: Array.map(
      updatedInbox.pendingRecoveryChats ?? [],
      (chat) => ({...chat, historyRequestedAt: at(5)})
    ),
  }
}

describe('recovering a chat on a restored inbox', () => {
  it('holds a message of an unknown sender in a hidden pending chat', () => {
    const {updatedInbox, visibleMessages} = receive(restoredInbox, [
      strangerMessage,
    ])

    expect(updatedInbox.chats).toEqual([])
    expect(visibleMessages).toEqual([])
    expect(
      Array.map(updatedInbox.pendingRecoveryChats ?? [], (chat) => [
        chat.chat.otherSide.publicKey,
        chat.messages,
      ])
    ).toEqual([[theirKey.publicKeyPemBase64, [strangerMessage]]])
  })

  it('keeps holding further messages until the history arrives', () => {
    const next = received(message(theirKey, {time: at(7), text: 'again'}))
    const {updatedInbox, visibleMessages} = receive(pendingInbox(), [next])

    expect(updatedInbox.chats).toEqual([])
    expect(visibleMessages).toEqual([])
    expect(updatedInbox.pendingRecoveryChats?.[0]?.messages).toEqual([
      strangerMessage,
      next,
    ])
  })

  it('ignores a history it did not ask for', () => {
    const notRequested = receive(restoredInbox, [strangerMessage]).updatedInbox
    const {updatedInbox, visibleMessages} = receive(notRequested, [
      history(validProof),
    ])

    expect(updatedInbox.chats).toEqual([])
    expect(visibleMessages).toEqual([])
    expect(updatedInbox.pendingRecoveryChats).toEqual(
      notRequested.pendingRecoveryChats
    )
  })

  it('ignores an unrequested history that slipped in with a message', () => {
    const notRequested = receive(restoredInbox, [strangerMessage]).updatedInbox
    const next = received(message(theirKey, {time: at(5)}))
    const {updatedInbox, visibleMessages} = receive(notRequested, [
      next,
      history(validProof),
    ])

    expect(updatedInbox.chats).toEqual([])
    expect(visibleMessages).toEqual([])
    expect(updatedInbox.pendingRecoveryChats?.[0]?.messages).toEqual([
      strangerMessage,
      next,
    ])
  })

  it.each([
    ['a wrong', proofForAnotherChat],
    ['a missing', undefined],
  ])('drops the chat on a history with %s proof', (_, proof) => {
    const {updatedInbox, visibleMessages} = receive(pendingInbox(), [
      history(proof),
    ])

    expect(updatedInbox.chats).toEqual([])
    expect(updatedInbox.pendingRecoveryChats).toEqual([])
    expect(visibleMessages).toEqual([])
  })

  it('shows the chat with its history once the history has the proof', () => {
    const proven = history(validProof)
    const {updatedInbox, visibleMessages} = receive(pendingInbox(), [proven])
    const [recovered] = updatedInbox.chats

    expect(updatedInbox.pendingRecoveryChats).toEqual([])
    expect(visibleMessages).toEqual([strangerMessage, proven])
    expect(recovered?.historyMerged).toBe(true)
    expect(recovered && isChatOpen(recovered)).toBe(true)
    expect(
      Array.map(recovered?.messages ?? [], (one) => [
        one.message.text,
        one.state,
        'restored' in one ? one.restored : undefined,
      ])
    ).toEqual([
      ['from history', 'received', true],
      ['hello', 'received', undefined],
    ])
  })
})
