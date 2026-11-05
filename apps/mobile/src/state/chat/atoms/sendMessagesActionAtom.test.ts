import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Deferred, Effect, HashSet, Schema} from 'effect'
import {atom, createStore} from 'jotai'
import {type ChatWithMessages} from '../domain'
import sendMessagesActionAtom from './sendMessagesActionAtom'

interface ServerMessage {
  receivedByServerAt: UnixMilliseconds
}
const mockSends: Array<Deferred.Deferred<ServerMessage, {_tag: string}>> = []
function mockSendMessage(): Effect.Effect<ServerMessage, {_tag: string}> {
  const send = Effect.runSync(Deferred.make<ServerMessage, {_tag: string}>())
  mockSends.push(send)
  return Deferred.await(send)
}
jest.mock('@vexl-next/resources-utils/src/chat/sendMessage', () => ({
  __esModule: true,
  default: () => mockSendMessage(),
}))
jest.mock('../../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom({chat: {}, notification: {}}),
}))
jest.mock('../chatImages', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    uploadChatImageIfAnyActionAtom: atom(
      null,
      (_get: unknown, _set: unknown, {message}: {message: unknown}) =>
        Effect.succeed(message)
    ),
  }
})
jest.mock(
  '../../../components/DonationPrompt/atoms/showDonationPromptGiveLoveActionAtom',
  () => {
    const {atom} = jest.requireActual('jotai')
    const {Effect} = jest.requireActual('effect')
    return {
      __esModule: true,
      default: atom(null, () => Effect.void),
      DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT: 10,
    }
  }
)
jest.mock('../../../utils/runWhenIdleWithTimeout', () => ({
  __esModule: true,
  default: (callback: () => void) => {
    callback()
  },
}))

function time(value: number): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(value)
}

const senderKey = generatePrivateKey()

function chatMessage(text: string, at: number): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    text,
    time: time(at),
    messageType: 'MESSAGE',
    senderPublicKey: senderKey.publicKeyPemBase64,
  }
}

function setup(): {
  send: (messages: Array.NonEmptyReadonlyArray<ChatMessage>) => void
  sendFromReopenedChat: (
    messages: Array.NonEmptyReadonlyArray<ChatMessage>
  ) => void
  shown: () => string[]
  deleteMessages: () => void
} {
  mockSends.length = 0
  const store = createStore()
  const chatAtom = atom<ChatWithMessages>({
    chat: {
      id: generateChatId(),
      inbox: {privateKey: senderKey},
      otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
      origin: {type: 'unknown'},
      isUnread: false,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      showVexlbotNotifications: true,
      otherSideVersion: Schema.decodeSync(VersionString)('26.11.0'),
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
  })
  const sendMessagesAtom = sendMessagesActionAtom(chatAtom)
  const reopenedChatSendMessagesAtom = sendMessagesActionAtom(chatAtom)

  return {
    send: (messages) => {
      store.set(sendMessagesAtom, messages)
    },
    sendFromReopenedChat: (messages) => {
      store.set(reopenedChatSendMessagesAtom, messages)
    },
    shown: () =>
      Array.map(
        store.get(chatAtom).messages,
        ({state, message}) => `${message.text}:${state}`
      ),
    deleteMessages: () => {
      store.set(chatAtom, (chat) => ({...chat, messages: []}))
    },
  }
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

async function settleSend(
  index: number,
  outcome: ServerMessage | 'fail' | 'inboxDeleted'
): Promise<void> {
  const send = mockSends[index]
  if (!send) throw new Error(`send ${index} was not started`)
  await Effect.runPromise(
    outcome === 'fail'
      ? Deferred.fail(send, {_tag: 'NetworkError'})
      : outcome === 'inboxDeleted'
        ? Deferred.fail(send, {_tag: 'ReceiverInboxDoesNotExistError'})
        : Deferred.succeed(send, outcome)
  )
  await flush()
}

describe('sendMessagesActionAtom', () => {
  it('keeps the batch in order while server times arrive', async () => {
    const {send, shown} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101), chatMessage('c', 102)])
    await flush()
    expect(mockSends).toHaveLength(1)

    await settleSend(0, {receivedByServerAt: time(500)})
    expect(shown()).toEqual(['a:sent', 'b:sending', 'c:sending'])

    await settleSend(1, {receivedByServerAt: time(600)})
    await settleSend(2, {receivedByServerAt: time(700)})
    expect(shown()).toEqual(['a:sent', 'b:sent', 'c:sent'])
  })

  it('stops the batch at the first failure', async () => {
    const {send, shown} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101), chatMessage('c', 102)])
    await flush()

    await settleSend(0, {receivedByServerAt: time(500)})
    await settleSend(1, 'fail')
    expect(mockSends).toHaveLength(2)
    expect(shown()).toEqual(['a:sent', 'b:sendingError', 'c:sendingError'])
  })

  it('sends a later batch only after the previous one', async () => {
    const {send, shown} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101)])
    send([chatMessage('text', 102)])
    await flush()
    expect(mockSends).toHaveLength(1)

    await settleSend(0, {receivedByServerAt: time(500)})
    expect(shown()).toEqual(['a:sent', 'b:sending', 'text:sending'])
    await settleSend(1, {receivedByServerAt: time(600)})
    expect(shown()).toEqual(['a:sent', 'b:sent', 'text:sending'])
    await settleSend(2, {receivedByServerAt: time(700)})
    expect(shown()).toEqual(['a:sent', 'b:sent', 'text:sent'])
  })

  it('does not send the rest of a batch once its messages are gone', async () => {
    const {send, deleteMessages} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101)])
    await flush()

    deleteMessages()
    await settleSend(0, {receivedByServerAt: time(500)})
    expect(mockSends).toHaveLength(1)
  })

  it('keeps a later send after the batch when the client clock is behind', async () => {
    const {send, shown} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101)])
    await flush()

    await settleSend(0, {receivedByServerAt: time(500)})
    send([chatMessage('text', 200)])
    expect(shown()).toEqual(['a:sent', 'b:sending', 'text:sending'])

    await settleSend(1, {receivedByServerAt: time(600)})
    expect(shown()).toEqual(['a:sent', 'b:sent', 'text:sending'])
    await settleSend(2, {receivedByServerAt: time(700)})
    expect(shown()).toEqual(['a:sent', 'b:sent', 'text:sent'])
  })

  it('stops the batch with one notice when the other side deleted the inbox', async () => {
    const {send, shown} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101)])
    await flush()

    await settleSend(0, 'inboxDeleted')
    expect(mockSends).toHaveLength(1)
    expect(shown()).toEqual([
      'a:sendingError',
      'b:sendingError',
      'Inbox deleted:received',
    ])
  })

  it('keeps sends from a reopened chat behind the running batch', async () => {
    const {send, sendFromReopenedChat, shown} = setup()
    send([chatMessage('a', 100), chatMessage('b', 101)])
    sendFromReopenedChat([chatMessage('text', 102)])
    await flush()
    expect(mockSends).toHaveLength(1)

    await settleSend(0, {receivedByServerAt: time(500)})
    await settleSend(1, {receivedByServerAt: time(600)})
    await settleSend(2, {receivedByServerAt: time(700)})
    expect(shown()).toEqual(['a:sent', 'b:sent', 'text:sent'])
  })
})
