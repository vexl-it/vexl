import {
  generatePrivateKey,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  createHistoryMessage,
  createRequestHistoryMessage,
} from '@vexl-next/resources-utils/src/chat/utils/chatHistory'
import {HashSet, Schema} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import addMessagesToChats from './addMessagesToChats'
import {
  chatsToAnswerWithHistory,
  chatsWaitingForHistoryRequest,
  isRestoredInboxInGracePeriod,
  messagesToShareAsHistory,
  restoredMessagesFromHistory,
} from './chatRecovery'
import isChatOpen from './isChatOpen'
import {getChatState} from './offerStates'

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
const myKey = generatePrivateKey()
const theirKey = generatePrivateKey()

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

function sent(chatMessage: ChatMessage): ChatMessageWithState {
  return {
    state: 'sent',
    message: chatMessage,
    receivedByServerAt: chatMessage.time,
  }
}

function chat({
  inboxKey,
  otherSideKey,
  messages,
  restoredFromBackup,
}: {
  inboxKey: PrivateKeyHolder
  otherSideKey: PrivateKeyHolder
  messages: ChatMessageWithState[]
  restoredFromBackup?: boolean
}): ChatWithMessages {
  return {
    chat: {
      id: generateChatId(),
      inbox: {privateKey: inboxKey},
      otherSide: {publicKey: otherSideKey.publicKeyPemBase64},
      origin: {type: 'unknown'},
      isUnread: false,
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
    restoredFromBackup,
  }
}

// What the other side (`theirKey`) sends after we restored our account
function historyFromTheirCopy(
  theirMessages: ChatMessageWithState[]
): ChatMessageWithState {
  return received(
    createHistoryMessage({
      senderPublicKey: theirKey.publicKeyPemBase64,
      myVersion: version,
      messages: messagesToShareAsHistory(
        chat({inboxKey: theirKey, otherSideKey: myKey, messages: theirMessages})
      ),
    })
  )
}

describe('restored chat state', () => {
  it('counts as open until history says otherwise', () => {
    const liveMessage = received(message(theirKey, {time: at(10)}))
    const restoredChat = chat({
      inboxKey: myKey,
      otherSideKey: theirKey,
      messages: [liveMessage],
      restoredFromBackup: true,
    })

    expect(getChatState(restoredChat)).toBe('chatOpen')
    expect(isChatOpen(restoredChat)).toBe(true)

    const regularChat = {...restoredChat, restoredFromBackup: undefined}
    expect(getChatState(regularChat)).toBe('chatClosed')
    expect(isChatOpen(regularChat)).toBe(false)
  })

  it('lists recovered chats that still need a history request', () => {
    const waiting = chat({
      inboxKey: myKey,
      otherSideKey: theirKey,
      messages: [],
      restoredFromBackup: true,
    })
    const requested = {...waiting, historyRequestedAt: at(20)}
    const regular = chat({
      inboxKey: myKey,
      otherSideKey: theirKey,
      messages: [],
    })

    expect(
      chatsWaitingForHistoryRequest({
        inbox: {privateKey: myKey},
        chats: [waiting, requested, regular],
      })
    ).toEqual([waiting])
  })
})

describe('answering history requests', () => {
  const requester = generatePrivateKey()
  const knownChat = chat({
    inboxKey: myKey,
    otherSideKey: requester,
    messages: [],
  })
  const inbox: InboxInState = {inbox: {privateKey: myKey}, chats: [knownChat]}

  function request(key: PrivateKeyHolder): ChatMessageWithState {
    return received(
      createRequestHistoryMessage({
        senderPublicKey: key.publicKeyPemBase64,
        myVersion: version,
      })
    )
  }

  it('answers each known sender once and ignores unknown senders', () => {
    expect(
      chatsToAnswerWithHistory({
        inbox,
        newMessages: [
          request(requester),
          request(requester),
          request(generatePrivateKey()),
          received(message(requester, {time: at(1)})),
        ],
      })
    ).toEqual([knownChat])
  })

  it('shares only delivered messages', () => {
    const deliveredReceived = received(message(requester, {time: at(1)}))
    const deliveredSent = sent(message(myKey, {time: at(2)}))
    const stillSending: ChatMessageWithState = {
      state: 'sending',
      message: message(myKey, {time: at(3)}),
    }

    expect(
      messagesToShareAsHistory(
        chat({
          inboxKey: myKey,
          otherSideKey: requester,
          messages: [deliveredReceived, deliveredSent, stillSending],
        })
      )
    ).toEqual([
      {state: 'received', message: deliveredReceived.message},
      {state: 'sent', message: deliveredSent.message},
    ])
  })

  it('switches notifications to the token from the request', () => {
    const token = Schema.decodeSync(VexlNotificationToken)('vexl_nt_new_device')
    const [updated] = addMessagesToChats([knownChat])([
      received(
        createRequestHistoryMessage({
          senderPublicKey: requester.publicKeyPemBase64,
          myVersion: version,
          myVexlToken: token,
        })
      ),
    ])

    expect(updated?.chat.otherSideFcmCypher).toBe(token)
    expect(updated?.messages).toEqual([])
  })
})

describe('merging received history', () => {
  const request = message(theirKey, {
    time: at(1),
    messageType: 'REQUEST_MESSAGING',
  })
  const approval = message(myKey, {
    time: at(2),
    messageType: 'APPROVE_MESSAGING',
  })
  const fromThem = message(theirKey, {time: at(3), text: 'their message'})
  const fromMe = message(myKey, {time: at(4), text: 'my message'})
  const liveMessage = message(theirKey, {time: at(10), text: 'live'})

  const theirCopy = [
    sent(request),
    received(approval),
    sent(fromThem),
    received(fromMe),
    sent(liveMessage),
  ]

  function restoredChat(): ChatWithMessages {
    return {
      ...chat({
        inboxKey: myKey,
        otherSideKey: theirKey,
        messages: [received(liveMessage)],
        restoredFromBackup: true,
      }),
      historyRequestedAt: at(11),
    }
  }

  it('puts restored messages before live ones with flipped direction', () => {
    const [merged] = addMessagesToChats([restoredChat()])([
      historyFromTheirCopy(theirCopy),
    ])

    expect(
      merged?.messages.map((one) => [
        one.message.uuid,
        one.state,
        'restored' in one ? one.restored : undefined,
      ])
    ).toEqual([
      [request.uuid, 'received', true],
      [approval.uuid, 'sent', true],
      [fromThem.uuid, 'received', true],
      [fromMe.uuid, 'sent', true],
      [liveMessage.uuid, 'received', undefined],
    ])
    expect(merged && getChatState(merged)).toBe('chatOpen')
  })

  it('accepts only one history', () => {
    const [once] = addMessagesToChats([restoredChat()])([
      historyFromTheirCopy(theirCopy),
    ])
    const injected = message(myKey, {time: at(5), text: 'injected'})
    const [twice] = addMessagesToChats(once ? [once] : [])([
      historyFromTheirCopy([...theirCopy, received(injected)]),
    ])

    expect(once?.historyMerged).toBe(true)
    expect(twice?.messages).toEqual(once?.messages)
  })

  it('accepts no history before it was requested', () => {
    const notRequested = {...restoredChat(), historyRequestedAt: undefined}
    const [merged] = addMessagesToChats([notRequested])([
      historyFromTheirCopy(theirCopy),
    ])

    expect(merged?.messages).toEqual(notRequested.messages)
    expect(merged?.historyMerged).toBe(false)
  })

  it('drops history messages dated after the request', () => {
    const afterRequest = message(myKey, {time: at(12), text: 'after'})
    const [merged] = addMessagesToChats([restoredChat()])([
      historyFromTheirCopy([...theirCopy, received(afterRequest)]),
    ])

    expect(merged?.messages.map((one) => one.message.uuid)).not.toContain(
      afterRequest.uuid
    )
  })

  it('derives the chat state from the history', () => {
    const [merged] = addMessagesToChats([restoredChat()])([
      historyFromTheirCopy([sent(request)]),
    ])

    expect(merged && getChatState(merged)).toBe('requestedByThem')
  })

  it('ignores history in chats that were not restored', () => {
    const regularChat = {...restoredChat(), restoredFromBackup: undefined}

    expect(
      restoredMessagesFromHistory({
        chat: regularChat,
        incoming: [historyFromTheirCopy(theirCopy)],
      })
    ).toEqual([])
  })

  it('rebuilds the trade checklist in chronological order', () => {
    const update = (
      key: PrivateKeyHolder,
      day: number,
      amount: number
    ): ChatMessage =>
      message(key, {
        time: at(day),
        messageType: 'TRADE_CHECKLIST_UPDATE',
        tradeChecklistUpdate: {
          amount: {btcAmount: amount, timestamp: at(day)},
        },
      })

    const liveUpdate = update(theirKey, 10, 10)
    const chatWithLiveUpdate = {
      ...restoredChat(),
      messages: [received(liveUpdate)],
    }
    const [merged] = addMessagesToChats([chatWithLiveUpdate])([
      historyFromTheirCopy([
        sent(update(theirKey, 1, 1)),
        received(update(myKey, 2, 2)),
        sent(liveUpdate),
      ]),
    ])
    const checklist = merged?.tradeChecklist

    expect(checklist?.amount.received?.btcAmount).toBe(10)
    expect(checklist?.amount.sent?.btcAmount).toBe(2)
  })
})

describe('restored inbox cleanup', () => {
  const restoredInbox: InboxInState = {
    inbox: {privateKey: myKey},
    chats: [],
    restoredFromBackup: true,
    restoredAt: at(1),
  }

  it('keeps a restored inbox for 30 days', () => {
    expect(
      isRestoredInboxInGracePeriod({inbox: restoredInbox, now: at(30)})
    ).toBe(true)
    expect(
      isRestoredInboxInGracePeriod({inbox: restoredInbox, now: at(31)})
    ).toBe(false)
  })

  it('does not keep regular inboxes', () => {
    expect(
      isRestoredInboxInGracePeriod({
        inbox: {inbox: {privateKey: myKey}, chats: []},
        now: at(1),
      })
    ).toBe(false)
  })
})
