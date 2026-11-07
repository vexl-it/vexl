import {
  generatePrivateKey,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatRecoveryProof,
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
  isPendingRecoveryChatExpired,
  isRestoredInboxInGracePeriod,
  messagesToShareAsHistory,
  newlyRecoveredChats,
  recordHistoryRequest,
  restoredMessagesFromHistory,
  startedSupportingChatRecovery,
} from './chatRecovery'
import isChatOpen from './isChatOpen'
import {getChatState} from './offerStates'
import settlePendingRecoveryChats from './settlePendingRecoveryChats'

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

const version = Schema.decodeSync(VersionString)('26.11.2')
const myKey = generatePrivateKey()
const theirKey = generatePrivateKey()
const recoveryProof = Schema.decodeSync(ChatRecoveryProof)(
  'P1ue9DFW6etINYILGhfXuAZiiwHjfj40ZGSNF7T/whY='
)

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
    reactions: {},
    restoredFromBackup,
  }
}

// What the other side (`theirKey`) sends after we restored our account
function historyFromTheirCopy(
  theirMessages: ChatMessageWithState[],
  myVexlToken?: VexlNotificationToken
): ChatMessageWithState {
  return received(
    createHistoryMessage({
      senderPublicKey: theirKey.publicKeyPemBase64,
      myVersion: version,
      messages: messagesToShareAsHistory(
        chat({inboxKey: theirKey, otherSideKey: myKey, messages: theirMessages})
      ),
      historyRecoveryProof: recoveryProof,
      myVexlToken,
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

  it('lists pending recovery chats that still need a history request', () => {
    const pendingWith = (otherSideKey: PrivateKeyHolder): ChatWithMessages => {
      const pending = chat({
        inboxKey: myKey,
        otherSideKey,
        messages: [],
        restoredFromBackup: true,
      })
      return {...pending, chat: {...pending.chat, otherSideVersion: version}}
    }
    const asked = pendingWith(theirKey)
    const neverAsked = pendingWith(generatePrivateKey())
    const inbox = {
      inbox: {privateKey: myKey},
      chats: [],
      pendingRecoveryChats: [asked, neverAsked],
      historyRequestedAt: {[theirKey.publicKeyPemBase64]: at(20)},
    }

    expect(
      chatsWaitingForHistoryRequest({
        inbox,
        now: Schema.decodeSync(UnixMilliseconds)(at(20) + 30 * 60 * 1000),
      })
    ).toEqual([neverAsked])
    // The request or its answer got lost, so it is asked again.
    expect(chatsWaitingForHistoryRequest({inbox, now: at(21)})).toEqual([
      asked,
      neverAsked,
    ])
  })

  it('asks a sender at most once an hour, also across re-created pending chats', () => {
    const pending = chat({
      inboxKey: myKey,
      otherSideKey: theirKey,
      messages: [],
      restoredFromBackup: true,
    })
    const waiting = {
      ...pending,
      chat: {...pending.chat, otherSideVersion: version},
    }
    const requested = recordHistoryRequest({
      inbox: {
        inbox: {privateKey: myKey},
        chats: [],
        pendingRecoveryChats: [waiting],
      },
      sender: theirKey.publicKeyPemBase64,
      now: at(20),
    })
    expect(requested.pendingRecoveryChats?.[0]?.historyRequestedAt).toBe(at(20))

    // Its chat was dropped and the sender wrote again.
    const recreated = {...requested, pendingRecoveryChats: [waiting]}
    const soon = Schema.decodeSync(UnixMilliseconds)(at(20) + 30 * 60 * 1000)
    expect(
      chatsWaitingForHistoryRequest({inbox: recreated, now: soon})
    ).toEqual([])
    expect(
      chatsWaitingForHistoryRequest({inbox: recreated, now: at(21)})
    ).toEqual([waiting])
  })

  it('asks for history only once the other side runs an app that can answer', () => {
    const pending = chat({
      inboxKey: myKey,
      otherSideKey: theirKey,
      messages: [received(message(theirKey, {time: at(1)}))],
      restoredFromBackup: true,
    })
    const fromOldApp = {
      ...pending,
      chat: {
        ...pending.chat,
        otherSideVersion: Schema.decodeSync(VersionString)('26.9.5'),
      },
    }
    const waiting = (one: ChatWithMessages): readonly ChatWithMessages[] =>
      chatsWaitingForHistoryRequest({
        inbox: {
          inbox: {privateKey: myKey},
          chats: [],
          pendingRecoveryChats: [one],
        },
        now: at(2),
      })
    expect(waiting(fromOldApp)).toEqual([])

    const {pending: [updated] = []} = settlePendingRecoveryChats({
      chats: [fromOldApp],
      incoming: [
        received(message(theirKey, {time: at(2), myVersion: version})),
      ],
      expectedRecoveryProof: () => recoveryProof,
    })

    expect(updated?.chat.otherSideVersion).toBe(version)
    expect(updated && waiting(updated)).toHaveLength(1)
  })

  it('drops a pending recovery chat 30 days after the recovery started', () => {
    const pending = {
      ...chat({
        inboxKey: myKey,
        otherSideKey: theirKey,
        // Neither an old queued message nor a future-dated one matters
        messages: [
          received(message(theirKey, {time: at(-100)})),
          received(message(theirKey, {time: at(1000)})),
        ],
        restoredFromBackup: true,
      }),
      recoveryStartedAt: at(1),
    }

    expect(isPendingRecoveryChatExpired({chat: pending, now: at(30)})).toBe(
      false
    )
    expect(isPendingRecoveryChatExpired({chat: pending, now: at(31)})).toBe(
      true
    )
  })
})

describe('delivering our recovery proof', () => {
  const v = Schema.decodeSync(VersionString)

  it('resends it once the other side updates to a version that keeps it', () => {
    expect(
      startedSupportingChatRecovery({
        previousVersion: v('26.9.5'),
        reportedVersion: v('26.11.2'),
      })
    ).toBe(true)
    expect(
      startedSupportingChatRecovery({
        previousVersion: undefined,
        reportedVersion: v('26.11.3'),
      })
    ).toBe(true)
  })

  it('does not resend it for other version updates', () => {
    expect(
      startedSupportingChatRecovery({
        previousVersion: v('26.11.2'),
        reportedVersion: v('26.11.3'),
      })
    ).toBe(false)
    expect(
      startedSupportingChatRecovery({
        previousVersion: v('26.9.0'),
        reportedVersion: v('26.9.5'),
      })
    ).toBe(false)
  })

  it('keeps the latest proof the other side sent', () => {
    const regularChat = chat({
      inboxKey: myKey,
      otherSideKey: theirKey,
      messages: [],
    })
    const [withProof] = addMessagesToChats([regularChat])([
      received(
        message(theirKey, {
          time: at(1),
          messageType: 'REQUEST_MESSAGING',
          recoveryProof,
        })
      ),
    ])
    const [afterMessageWithoutProof] = addMessagesToChats(
      withProof ? [withProof] : []
    )([received(message(theirKey, {time: at(2)}))])

    expect(withProof?.otherSideRecoveryProof).toBe(recoveryProof)
    expect(afterMessageWithoutProof?.otherSideRecoveryProof).toBe(recoveryProof)
  })
})

describe('answering history requests', () => {
  const requester = generatePrivateKey()
  const knownChat: ChatWithMessages = {
    ...chat({
      inboxKey: myKey,
      otherSideKey: requester,
      messages: [
        sent(message(myKey, {time: at(1), messageType: 'APPROVE_MESSAGING'})),
      ],
    }),
    otherSideRecoveryProof: recoveryProof,
  }
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

  it('does not answer in a closed chat', () => {
    const closedChat: ChatWithMessages = {
      ...knownChat,
      messages: [
        ...knownChat.messages,
        received(message(requester, {time: at(2), messageType: 'DELETE_CHAT'})),
      ],
    }

    expect(
      chatsToAnswerWithHistory({
        inbox: {...inbox, chats: [closedChat]},
        newMessages: [request(requester)],
      })
    ).toEqual([])
  })

  it('does not answer without the requester proof', () => {
    expect(
      chatsToAnswerWithHistory({
        inbox: {
          ...inbox,
          chats: [{...knownChat, otherSideRecoveryProof: undefined}],
        },
        newMessages: [request(requester)],
      })
    ).toEqual([])
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

  it('keeps notifying the token it had when a history is requested', () => {
    const oldToken = Schema.decodeSync(VexlNotificationToken)(
      'vexl_nt_before_restore'
    )
    const [updated] = addMessagesToChats([
      {...knownChat, chat: {...knownChat.chat, otherSideVexlToken: oldToken}},
    ])([
      received(
        createRequestHistoryMessage({
          senderPublicKey: requester.publicKeyPemBase64,
          myVersion: version,
        })
      ),
    ])

    expect(updated?.chat.otherSideVexlToken).toBe(oldToken)
    expect(updated?.messages).toEqual(knownChat.messages)
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

  it('switches notifications to the token from the history', () => {
    const token = Schema.decodeSync(VexlNotificationToken)('vexl_nt_history')
    const [merged] = addMessagesToChats([restoredChat()])([
      historyFromTheirCopy(theirCopy, token),
    ])

    expect(merged?.chat.otherSideVexlToken).toBe(token)
  })

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

  it('keeps history messages a clock running a few minutes ahead dated after the request', () => {
    const skewed = message(myKey, {
      time: Schema.decodeSync(UnixMilliseconds)(at(11) + 2 * 60 * 1000),
      text: 'skewed',
    })
    const [merged] = addMessagesToChats([restoredChat()])([
      historyFromTheirCopy([...theirCopy, received(skewed)]),
    ])

    expect(merged?.messages.map((one) => one.message.uuid)).toContain(
      skewed.uuid
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

describe('sending our token to recovered chats', () => {
  const pending = chat({
    inboxKey: myKey,
    otherSideKey: theirKey,
    messages: [],
    restoredFromBackup: true,
  })
  const recovered = {...pending, historyMerged: true}
  const previousInbox: InboxInState = {
    inbox: {privateKey: myKey},
    chats: [],
    pendingRecoveryChats: [pending],
  }

  it('lists a chat its history just recovered', () => {
    expect(
      newlyRecoveredChats({
        previousInbox,
        updatedInbox: {
          ...previousInbox,
          chats: [recovered],
          pendingRecoveryChats: [],
        },
      })
    ).toEqual([recovered])
  })

  it('lists nothing while the chat is pending or after it was dropped', () => {
    expect(
      newlyRecoveredChats({previousInbox, updatedInbox: previousInbox})
    ).toEqual([])
    expect(
      newlyRecoveredChats({
        previousInbox,
        updatedInbox: {...previousInbox, pendingRecoveryChats: []},
      })
    ).toEqual([])
  })

  it('does not list a chat that was already visible', () => {
    expect(
      newlyRecoveredChats({
        previousInbox: {...previousInbox, chats: [recovered]},
        updatedInbox: {...previousInbox, chats: [recovered]},
      })
    ).toEqual([])
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
