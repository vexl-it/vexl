import {
  generatePrivateKey,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  generateChatMessageId,
  MessageCypher,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {HashSet, Schema} from 'effect'
import {BlockedChatSender} from '../blockedChatSender'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import {
  filterIncomingMessages,
  shouldAcceptIncomingStreamOnlyMessage,
} from './filterIncomingMessages'

jest.mock('../../../utils/localization/I18nProvider', () => ({
  getCurrentLocale: () => 'en',
}))

type ReceivedChatMessage = Extract<ChatMessageWithState, {state: 'received'}>
type UnixMillisecondsType = typeof UnixMilliseconds.Type

function timestamp(value: number): UnixMillisecondsType {
  return Schema.decodeSync(UnixMilliseconds)(value)
}

function receivedMessage({
  messageType,
  senderPublicKey,
  time = timestamp(Date.UTC(2026, 0, 1)),
  receivedByServerAt,
}: {
  messageType: ChatMessage['messageType']
  senderPublicKey: PublicKeyPemBase64
  time?: UnixMillisecondsType
  receivedByServerAt?: UnixMillisecondsType
}): ReceivedChatMessage {
  return {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      messageType,
      senderPublicKey,
      text: '-',
      time,
    },
    receivedByServerAt,
  }
}

function sentMessage({
  messageType,
  senderKey,
}: {
  messageType: ChatMessage['messageType']
  senderKey: PrivateKeyHolder
}): ChatMessageWithState {
  return {
    state: 'sent',
    message: {
      uuid: generateChatMessageId(),
      messageType,
      senderPublicKey: senderKey.publicKeyPemBase64,
      text: '-',
      time: timestamp(Date.UTC(2026, 0, 1)),
    },
  }
}

function chatWithMessages({
  inboxKey,
  senderPublicKey,
  messages,
}: {
  inboxKey: PrivateKeyHolder
  senderPublicKey: PublicKeyPemBase64
  messages: ChatMessageWithState[]
}): ChatWithMessages {
  return {
    chat: {
      id: generateChatId(),
      inbox: {privateKey: inboxKey},
      otherSide: {publicKey: senderPublicKey},
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
  }
}

function inboxState(
  inboxKey: PrivateKeyHolder,
  chats: ChatWithMessages[] = []
): InboxInState {
  return {inbox: {privateKey: inboxKey}, chats}
}

describe('filterIncomingMessages', () => {
  const inboxKey = generatePrivateKey()
  const senderKey = generatePrivateKey()

  it('accepts only a request for an unknown sender', () => {
    const request = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
    })
    const regularMessage = receivedMessage({
      messageType: 'MESSAGE',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 2)),
    })

    expect(
      filterIncomingMessages({
        inbox: inboxState(inboxKey),
        messages: [request, regularMessage],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([request])
  })

  it('accepts cancellation while their request is pending', () => {
    const request = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
    })
    const duplicateRequest = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 2)),
    })
    const cancellation = receivedMessage({
      messageType: 'CANCEL_REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 3)),
    })
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [request],
      }),
    ])

    expect(
      filterIncomingMessages({
        inbox,
        messages: [duplicateRequest, cancellation],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([cancellation])
  })

  it('opens a requested-by-me chat and accepts the following message', () => {
    const request = sentMessage({
      messageType: 'REQUEST_MESSAGING',
      senderKey: inboxKey,
    })
    const approval = receivedMessage({
      messageType: 'APPROVE_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 2)),
    })
    const regularMessage = receivedMessage({
      messageType: 'MESSAGE',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 3)),
    })
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [request],
      }),
    ])

    expect(
      filterIncomingMessages({
        inbox,
        messages: [approval, regularMessage],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([approval, regularMessage])
  })

  it('uses server timestamps for the rerequest cooldown', () => {
    const denial = {
      ...receivedMessage({
        messageType: 'DISAPPROVE_MESSAGING',
        senderPublicKey: senderKey.publicKeyPemBase64,
        time: timestamp(Date.UTC(2025, 0, 1)),
        receivedByServerAt: timestamp(Date.UTC(2026, 0, 7)),
      }),
      state: 'sent',
    } satisfies ChatMessageWithState
    const tooEarly = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 1, 1)),
      receivedByServerAt: timestamp(Date.UTC(2026, 0, 13)),
    })
    const allowed = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 1, 1)),
      receivedByServerAt: timestamp(Date.UTC(2026, 0, 14)),
    })
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [denial],
      }),
    ])

    expect(
      filterIncomingMessages({
        inbox,
        messages: [tooEarly],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([])
    expect(
      filterIncomingMessages({
        inbox,
        messages: [allowed],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([allowed])
  })

  it('accepts normal open-chat messages but rejects handshake messages', () => {
    const request = sentMessage({
      messageType: 'REQUEST_MESSAGING',
      senderKey: inboxKey,
    })
    const approval = receivedMessage({
      messageType: 'APPROVE_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
    })
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [request, approval],
      }),
    ])
    const regularMessage = receivedMessage({
      messageType: 'MESSAGE',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 2)),
    })
    const cancellation = receivedMessage({
      messageType: 'CANCEL_REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 3)),
    })
    const duplicateApproval = receivedMessage({
      messageType: 'APPROVE_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 4)),
    })

    expect(
      filterIncomingMessages({
        inbox,
        messages: [regularMessage, cancellation, duplicateApproval],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([regularMessage])
  })

  it('accepts newer-version placeholders in pending request states', () => {
    const placeholder = (time: UnixMillisecondsType): ChatMessageWithState => ({
      state: 'receivedButRequiresNewerVersion',
      message: {
        uuid: generateChatMessageId(),
        messageType: 'REQUIRES_NEWER_VERSION',
        serverMessage: {
          message: Schema.decodeSync(MessageCypher)('cypher'),
          senderPublicKey: senderKey.publicKeyPemBase64,
        },
        minimalRequiredVersion: Schema.decodeSync(VersionString)('99.0.0'),
        time,
        senderPublicKey: senderKey.publicKeyPemBase64,
        text: '-',
      },
    })

    const requestedByMeChat = chatWithMessages({
      inboxKey,
      senderPublicKey: senderKey.publicKeyPemBase64,
      messages: [
        sentMessage({messageType: 'REQUEST_MESSAGING', senderKey: inboxKey}),
      ],
    })
    expect(
      filterIncomingMessages({
        inbox: inboxState(inboxKey, [requestedByMeChat]),
        messages: [placeholder(timestamp(Date.UTC(2026, 0, 2)))],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toHaveLength(1)

    const requestedByThemChat = chatWithMessages({
      inboxKey,
      senderPublicKey: senderKey.publicKeyPemBase64,
      messages: [
        receivedMessage({
          messageType: 'REQUEST_MESSAGING',
          senderPublicKey: senderKey.publicKeyPemBase64,
        }),
      ],
    })
    expect(
      filterIncomingMessages({
        inbox: inboxState(inboxKey, [requestedByThemChat]),
        messages: [placeholder(timestamp(Date.UTC(2026, 0, 2)))],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toHaveLength(1)

    const deniedChat = chatWithMessages({
      inboxKey,
      senderPublicKey: senderKey.publicKeyPemBase64,
      messages: [
        {
          ...receivedMessage({
            messageType: 'DISAPPROVE_MESSAGING',
            senderPublicKey: senderKey.publicKeyPemBase64,
          }),
          state: 'sent',
        } satisfies ChatMessageWithState,
      ],
    })
    expect(
      filterIncomingMessages({
        inbox: inboxState(inboxKey, [deniedChat]),
        messages: [placeholder(timestamp(Date.UTC(2026, 0, 2)))],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([])
  })

  it('rejects stored and stream-only messages from a blocked sender', () => {
    const request = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
    })
    const blockedSender = Schema.decodeSync(BlockedChatSender)({
      inboxPublicKey: inboxKey.publicKeyPemBase64,
      blockedSenderPublicKey: senderKey.publicKeyPemBase64,
    })
    const openChat = chatWithMessages({
      inboxKey,
      senderPublicKey: senderKey.publicKeyPemBase64,
      messages: [
        sentMessage({messageType: 'REQUEST_MESSAGING', senderKey: inboxKey}),
        receivedMessage({
          messageType: 'APPROVE_MESSAGING',
          senderPublicKey: senderKey.publicKeyPemBase64,
        }),
      ],
    })
    const inbox = inboxState(inboxKey, [openChat])

    expect(
      filterIncomingMessages({
        inbox,
        messages: [request],
        blockedSenders: [blockedSender],
        rerequestLimitDays: 7,
      })
    ).toEqual([])
    expect(
      shouldAcceptIncomingStreamOnlyMessage({
        inbox,
        senderPublicKey: senderKey.publicKeyPemBase64,
        blockedSenders: [blockedSender],
      })
    ).toBe(false)
  })

  it('accepts a cancellation racing our approval when no messages were exchanged yet', () => {
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [
          receivedMessage({
            messageType: 'REQUEST_MESSAGING',
            senderPublicKey: senderKey.publicKeyPemBase64,
          }),
          sentMessage({messageType: 'APPROVE_MESSAGING', senderKey: inboxKey}),
        ],
      }),
    ])
    const cancellation = receivedMessage({
      messageType: 'CANCEL_REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 2)),
    })
    const messageAfterCancellation = receivedMessage({
      messageType: 'MESSAGE',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 3)),
    })

    expect(
      filterIncomingMessages({
        inbox,
        messages: [cancellation, messageAfterCancellation],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([cancellation])
  })

  it('rejects a cancellation once regular messages were exchanged in the open chat', () => {
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [
          receivedMessage({
            messageType: 'REQUEST_MESSAGING',
            senderPublicKey: senderKey.publicKeyPemBase64,
          }),
          sentMessage({messageType: 'APPROVE_MESSAGING', senderKey: inboxKey}),
          receivedMessage({
            messageType: 'MESSAGE',
            senderPublicKey: senderKey.publicKeyPemBase64,
            time: timestamp(Date.UTC(2026, 0, 2)),
          }),
        ],
      }),
    ])
    const cancellation = receivedMessage({
      messageType: 'CANCEL_REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 3)),
    })

    expect(
      filterIncomingMessages({
        inbox,
        messages: [cancellation],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([])
  })

  it('rejects an approval after I cancelled my own request', () => {
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [
          sentMessage({messageType: 'REQUEST_MESSAGING', senderKey: inboxKey}),
          sentMessage({
            messageType: 'CANCEL_REQUEST_MESSAGING',
            senderKey: inboxKey,
          }),
        ],
      }),
    ])
    const approval = receivedMessage({
      messageType: 'APPROVE_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 2)),
    })
    const regularMessage = receivedMessage({
      messageType: 'MESSAGE',
      senderPublicKey: senderKey.publicKeyPemBase64,
      time: timestamp(Date.UTC(2026, 0, 3)),
    })

    expect(
      filterIncomingMessages({
        inbox,
        messages: [approval, regularMessage],
        blockedSenders: [],
        rerequestLimitDays: 7,
      })
    ).toEqual([])
  })

  it.each<ChatMessage['messageType']>(['BLOCK_CHAT', 'INBOX_DELETED'])(
    'rejects a new request after the chat was closed with %s',
    (closingMessageType) => {
      const inbox = inboxState(inboxKey, [
        chatWithMessages({
          inboxKey,
          senderPublicKey: senderKey.publicKeyPemBase64,
          messages: [
            sentMessage({
              messageType: 'REQUEST_MESSAGING',
              senderKey: inboxKey,
            }),
            receivedMessage({
              messageType: 'APPROVE_MESSAGING',
              senderPublicKey: senderKey.publicKeyPemBase64,
            }),
            receivedMessage({
              messageType: closingMessageType,
              senderPublicKey: senderKey.publicKeyPemBase64,
              time: timestamp(Date.UTC(2026, 0, 2)),
            }),
          ],
        }),
      ])
      const newRequest = receivedMessage({
        messageType: 'REQUEST_MESSAGING',
        senderPublicKey: senderKey.publicKeyPemBase64,
        time: timestamp(Date.UTC(2026, 5, 1)),
      })

      expect(
        filterIncomingMessages({
          inbox,
          messages: [newRequest],
          blockedSenders: [],
          rerequestLimitDays: 7,
        })
      ).toEqual([])
    }
  )

  it('scopes the blocklist to a single inbox', () => {
    const otherInboxKey = generatePrivateKey()
    const blockedSender = Schema.decodeSync(BlockedChatSender)({
      inboxPublicKey: inboxKey.publicKeyPemBase64,
      blockedSenderPublicKey: senderKey.publicKeyPemBase64,
    })
    const request = receivedMessage({
      messageType: 'REQUEST_MESSAGING',
      senderPublicKey: senderKey.publicKeyPemBase64,
    })

    expect(
      filterIncomingMessages({
        inbox: inboxState(otherInboxKey),
        messages: [request],
        blockedSenders: [blockedSender],
        rerequestLimitDays: 7,
      })
    ).toEqual([request])
  })

  it('accepts stream-only messages for an open chat', () => {
    const inbox = inboxState(inboxKey, [
      chatWithMessages({
        inboxKey,
        senderPublicKey: senderKey.publicKeyPemBase64,
        messages: [
          sentMessage({messageType: 'REQUEST_MESSAGING', senderKey: inboxKey}),
          receivedMessage({
            messageType: 'APPROVE_MESSAGING',
            senderPublicKey: senderKey.publicKeyPemBase64,
          }),
        ],
      }),
    ])

    expect(
      shouldAcceptIncomingStreamOnlyMessage({
        inbox,
        senderPublicKey: senderKey.publicKeyPemBase64,
        blockedSenders: [],
      })
    ).toBe(true)
  })
})
