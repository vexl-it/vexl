import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {HashSet, Schema} from 'effect'
import {createStore} from 'jotai'
import {storage} from '../../../utils/mmkv/effectMmkv'
import {
  MessagingState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import messagingStateAtom, {
  messagingStateAtomStorageAtom,
} from './messagingStateAtom'

jest.mock('react-native-mmkv')

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const myKey = generatePrivateKey()
const theirKey = generatePrivateKey()

function chat(): ChatWithMessages {
  return {
    chat: {
      id: generateChatId(),
      inbox: {privateKey: myKey},
      otherSide: {publicKey: theirKey.publicKeyPemBase64},
      origin: {type: 'unknown'},
      isUnread: false,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      showVexlbotNotifications: true,
    },
    messages: [],
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
    reactions: {},
  }
}

function savedMessagingState(): unknown {
  messagingStateAtomStorageAtom.flushNow()
  return JSON.parse(storage._storage.getString('messagingState') ?? '{}')
    .messagingState
}

it('saves the current version of chats and messages that changed since the last save', () => {
  const store = createStore()
  const message: ChatMessage = {
    uuid: generateChatMessageId(),
    text: 'hi',
    time: unixMillisecondsNow(),
    messageType: 'MESSAGE',
    senderPublicKey: myKey.publicKeyPemBase64,
  }
  const changingChat: ChatWithMessages = {
    ...chat(),
    messages: [{state: 'sending', message}],
  }
  const unchangedChat = chat()
  const inbox: InboxInState = {
    inbox: {privateKey: myKey},
    chats: [changingChat, unchangedChat],
  }

  store.set(messagingStateAtom, [inbox])
  expect(savedMessagingState()).toEqual(
    Schema.encodeSync(MessagingState)([inbox])
  )

  const changedChat: ChatWithMessages = {
    ...changingChat,
    messages: [{state: 'sent', message}],
    hiddenMessagesIds: HashSet.make(message.uuid),
  }
  const changedState = [{...inbox, chats: [changedChat, unchangedChat]}]

  store.set(messagingStateAtom, changedState)
  expect(savedMessagingState()).toEqual(
    Schema.encodeSync(MessagingState)(changedState)
  )
})
