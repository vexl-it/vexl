import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateChatMessageId,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {
  type RevealStatus,
  type TradeChecklistUpdate,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, HashSet, Option, Schema, pipe} from 'effect'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {createEmptyTradeChecklistInState} from '../../../state/tradeChecklist/domain'
import {revealEventForMessage} from '../../../state/tradeChecklist/utils/exchangeDetails'
import {friendChecksFromChat} from '../../../state/tradeChecklist/utils/friendCheck'
import buildMessagesListData from './buildMessagesListData'

jest.mock('../../../utils/localization/I18nProvider', () => ({
  getCurrentLocale: () => 'en-US',
}))

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const sender = generatePrivateKey()

function message({
  text,
  minute,
  restored,
  messageType = 'MESSAGE',
  tradeChecklistUpdate,
}: {
  text: string
  minute: number
  restored?: boolean
  messageType?: MessageType
  tradeChecklistUpdate?: TradeChecklistUpdate
}): ChatMessageWithState {
  return {
    state: 'received',
    restored,
    message: {
      uuid: generateChatMessageId(),
      text,
      messageType,
      tradeChecklistUpdate,
      senderPublicKey: sender.publicKeyPemBase64,
      time: Schema.decodeSync(UnixMilliseconds)(
        Date.UTC(2026, 0, 1, 12, minute)
      ),
    },
  }
}

function chatOpened(minute: number): ChatMessageWithState {
  return message({text: 'opened', minute, messageType: 'APPROVE_MESSAGING'})
}

function listShape(messages: ChatMessageWithState[]): string[] {
  return buildMessagesListData(
    messages,
    HashSet.empty(),
    createEmptyTradeChecklistInState(),
    []
  )
    .filter(
      (item) => item.type === 'message' || item.type === 'restoredDivider'
    )
    .map((item) =>
      item.type === 'message' ? item.message.message.text : 'divider'
    )
}

it('separates restored messages from live ones', () => {
  expect(
    listShape([
      message({text: 'r1', minute: 0, restored: true}),
      message({text: 'r2', minute: 1, restored: true}),
      message({text: 'live', minute: 2}),
    ])
  ).toEqual(['r1', 'r2', 'divider', 'live'])
})

it('separates messages by the time that passed between them', () => {
  const items = buildMessagesListData(
    [
      message({text: 'a', minute: 0}),
      message({text: 'b', minute: 1}),
      message({text: 'c', minute: 3}),
      message({text: 'd', minute: 20}),
    ],
    HashSet.empty(),
    createEmptyTradeChecklistInState(),
    []
  )

  expect(
    pipe(
      items,
      Array.map((item) => {
        if (item.type === 'message') return item.message.message.text
        if (item.type === 'time') return item.time.toMillis()
        return item.type
      })
    )
  ).toEqual([
    Date.UTC(2026, 0, 1, 12, 0),
    'a',
    'b',
    'space',
    'c',
    Date.UTC(2026, 0, 1, 12, 20),
    'd',
    'typingIndicator',
  ])
})

it('shows no divider in chats without restored messages', () => {
  expect(
    listShape([
      message({text: 'a', minute: 0}),
      message({text: 'b', minute: 1}),
    ])
  ).not.toContain('divider')
})

function revealMessage({
  state,
  minute,
  status,
  group,
}: {
  state: 'sent' | 'received'
  minute: number
  status: RevealStatus
  group: 'identity' | 'contact'
}): ChatMessageWithState {
  const time = Schema.decodeSync(UnixMilliseconds)(
    Date.UTC(2026, 0, 1, 12, minute)
  )
  const tradeChecklistUpdate: TradeChecklistUpdate =
    group === 'identity'
      ? {
          identity: {
            status,
            deanonymizedUser: {name: Schema.decodeSync(UserName)('Dave')},
            timestamp: time,
          },
        }
      : {
          contact: {
            status,
            fullPhoneNumber:
              Schema.decodeSync(E164PhoneNumber)('+420777777777'),
            timestamp: time,
          },
        }

  return {
    state,
    message: {
      uuid: generateChatMessageId(),
      text: 'Checklist updated',
      messageType: 'TRADE_CHECKLIST_UPDATE',
      tradeChecklistUpdate,
      senderPublicKey: sender.publicKeyPemBase64,
      time,
    },
  }
}

it('shows an identity and phone exchange after both are approved', () => {
  const messages = [
    revealMessage({
      state: 'sent',
      minute: 0,
      status: 'REQUEST_REVEAL',
      group: 'identity',
    }),
    revealMessage({
      state: 'sent',
      minute: 0,
      status: 'REQUEST_REVEAL',
      group: 'contact',
    }),
    revealMessage({
      state: 'received',
      minute: 1,
      status: 'APPROVE_REVEAL',
      group: 'identity',
    }),
    revealMessage({
      state: 'received',
      minute: 1,
      status: 'APPROVE_REVEAL',
      group: 'contact',
    }),
  ]
  const chat = {messages, tradeChecklist: createEmptyTradeChecklistInState()}

  const renderedReveals = pipe(
    buildMessagesListData(messages, HashSet.empty(), chat.tradeChecklist, []),
    Array.filterMap((item) =>
      item.type === 'message'
        ? Option.fromNullable(revealEventForMessage(chat, item.message))
        : Option.none()
    ),
    Array.map((event) => ({
      direction: event.direction,
      identity: event.reveal.identity?.status,
      contact: event.reveal.contact?.status,
    }))
  )

  expect(renderedReveals).toEqual([
    {
      direction: 'received',
      identity: 'APPROVE_REVEAL',
      contact: 'APPROVE_REVEAL',
    },
  ])
})

describe('friend check', () => {
  const friend = Schema.decodeSync(HashedPhoneNumber)('friend')

  function friendCheckMessage(
    minute: number,
    status: 'REQUEST' | 'VOUCHED'
  ): ChatMessageWithState {
    return message({
      text: status,
      minute,
      messageType: 'TRADE_CHECKLIST_UPDATE',
      tradeChecklistUpdate: {
        friendCheck: {
          friend,
          status,
          phraseSeed: status === 'REQUEST' ? 1 : undefined,
          timestamp: Schema.decodeSync(UnixMilliseconds)(minute),
        },
      },
    })
  }

  function texts(
    messages: ChatMessageWithState[],
    hidden: HashSet.HashSet<
      ChatMessageWithState['message']['uuid']
    > = HashSet.empty()
  ): string[] {
    return pipe(
      buildMessagesListData(
        messages,
        hidden,
        createEmptyTradeChecklistInState(),
        friendChecksFromChat({messages})
      ),
      Array.filterMap((item) => {
        if (item.type === 'message')
          return Option.some(item.message.message.text)
        if (item.type === 'friendCheckPrompt') return Option.some('prompt')
        return Option.none()
      })
    )
  }

  it('shows one card per check', () => {
    expect(
      texts([
        message({text: 'hi', minute: 0}),
        friendCheckMessage(1, 'REQUEST'),
        friendCheckMessage(2, 'VOUCHED'),
      ])
    ).toEqual(['hi', 'REQUEST'])
  })

  it('hides checks about people who are not my common friends', () => {
    const messages = [friendCheckMessage(1, 'REQUEST')]

    expect(
      pipe(
        buildMessagesListData(
          messages,
          HashSet.empty(),
          createEmptyTradeChecklistInState(),
          []
        ),
        Array.filter((item) => item.type === 'message')
      )
    ).toEqual([])
  })

  it('places the prompt right after the chat was opened', () => {
    expect(
      texts([
        message({text: 'request', minute: 0}),
        chatOpened(1),
        message({text: 'hi', minute: 2}),
      ])
    ).toEqual(['request', 'opened', 'prompt', 'hi'])
  })

  it('keeps the prompt in place when the opening message is hidden', () => {
    const opened = chatOpened(1)

    expect(
      texts(
        [
          message({text: 'request', minute: 0}),
          opened,
          message({text: 'hi', minute: 2}),
        ],
        HashSet.make(opened.message.uuid)
      )
    ).toEqual(['request', 'prompt', 'hi'])
    expect(
      texts(
        [message({text: 'request', minute: 0}), opened],
        HashSet.make(opened.message.uuid)
      )
    ).toEqual(['request', 'prompt'])
  })

  it('shows no prompt before the chat is opened', () => {
    expect(texts([message({text: 'request', minute: 0})])).toEqual(['request'])
  })
})
