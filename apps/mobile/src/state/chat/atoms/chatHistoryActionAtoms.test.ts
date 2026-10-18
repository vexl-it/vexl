import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatRecoveryProof,
  generateChatId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {createRequestHistoryMessage} from '@vexl-next/resources-utils/src/chat/utils/chatHistory'
import {Effect, HashSet, Schema} from 'effect'
import {createStore} from 'jotai'
import {type ChatWithMessages, type InboxInState} from '../domain'
import {
  answerHistoryRequestsActionAtom,
  processPendingRecoveryChatsActionAtom,
} from './chatHistoryActionAtoms'
import messagingStateAtom from './messagingStateAtom'

jest.mock('react-native-mmkv')

jest.mock('url-join', () => jest.fn((...parts: string[]) => parts.join('/')))

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))

jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {apiAtom: atom({chat: {}, notification: {}})}
})

jest.mock('@vexl-next/resources-utils/src/chat/sendMessage', () => {
  const {Effect: TestEffect} = jest.requireActual('effect')
  return {
    __esModule: true,
    default: jest.fn(() => TestEffect.succeed({receivedByServerAt: 1})),
  }
})

const mockMintToken = jest.fn()

jest.mock('../../notifications/actions/generateVexlTokenActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect: TestEffect} = jest.requireActual('effect')
  return {
    generateAndRegisterVexlTokenActionAtom: atom(null, () => {
      mockMintToken()
      return TestEffect.succeed('vexl_nt_fresh')
    }),
  }
})

jest.mock('../utils/myChatRecoveryProof', () => ({
  myChatRecoveryProofToShare: () => undefined,
}))

jest.mock('../../../utils/reportError', () => {
  const {Effect: TestEffect} = jest.requireActual('effect')
  return {
    __esModule: true,
    default: jest.fn(),
    reportErrorE: jest.fn(() => TestEffect.void),
  }
})

jest.mock('../../../utils/localization/I18nProvider', () => ({
  getCurrentLocale: () => 'en-US',
}))

const sendMessageMock = jest.mocked(sendMessage)
const myKey = generatePrivateKey()
const theirKey = generatePrivateKey()

function chat(fields: Partial<ChatWithMessages> = {}): ChatWithMessages {
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
    ...fields,
  }
}

function sentMessages(): ChatMessage[] {
  return sendMessageMock.mock.calls.map(([args]) => args.message)
}

describe('chat history requests and answers', () => {
  function storeWith(inbox: InboxInState): ReturnType<typeof createStore> {
    const store = createStore()
    store.set(messagingStateAtom, [inbox])
    return store
  }

  beforeEach(() => {
    sendMessageMock.mockClear()
    mockMintToken.mockClear()
  })

  it('asks a pending sender for history without minting a token', async () => {
    const pending = chat({
      restoredFromBackup: true,
      recoveryStartedAt: unixMillisecondsNow(),
    })
    const store = storeWith({
      inbox: {privateKey: myKey},
      chats: [],
      pendingRecoveryChats: [pending],
    })
    await Effect.runPromise(
      store.set(processPendingRecoveryChatsActionAtom, myKey.publicKeyPemBase64)
    )

    const [request] = sentMessages()
    expect(request?.messageType).toBe('REQUEST_HISTORY')
    expect(request?.myFcmCypher).toBeUndefined()
    expect(request?.myVexlToken).toBeUndefined()
    expect(sendMessageMock.mock.calls[0]?.[0].recoveryProof).toBeUndefined()
    expect(mockMintToken).not.toHaveBeenCalled()
    expect(
      store.get(messagingStateAtom)[0]?.pendingRecoveryChats?.[0]
        ?.historyRequestedAt
    ).toBeDefined()
  })

  it('answers a request with history carrying a fresh token', async () => {
    const known = chat({
      otherSideRecoveryProof: Schema.decodeSync(ChatRecoveryProof)(
        'P1ue9DFW6etINYILGhfXuAZiiwHjfj40ZGSNF7T/whY='
      ),
    })
    const inbox: InboxInState = {inbox: {privateKey: myKey}, chats: [known]}
    const store = storeWith(inbox)

    await Effect.runPromise(
      store.set(answerHistoryRequestsActionAtom, {
        inbox,
        newMessages: [
          {
            state: 'received',
            message: createRequestHistoryMessage({
              senderPublicKey: theirKey.publicKeyPemBase64,
              myVersion: Schema.decodeSync(VersionString)('26.10.0'),
            }),
          },
        ],
      })
    )

    const [history] = sentMessages()
    expect(history?.messageType).toBe('HISTORY')
    expect(mockMintToken).toHaveBeenCalledTimes(1)
    expect(history?.myFcmCypher).toBe('vexl_nt_fresh')
  })
})
