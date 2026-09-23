import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Effect, Option, Schema, pipe} from 'effect'
import {filterMap, head, map} from 'effect/Array'
import {atom, createStore} from 'jotai'
import {tradeChecklistDataAtom} from '../../tradeChecklist/atoms/fromChatAtoms'
import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import createSubmitChecklistUpdateActionAtom from '../atoms/sendTradeChecklistUpdateActionAtom'
import {
  dummyChatWithMessages,
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../domain'
import addMessagesToChats from './addMessagesToChats'

jest.mock('../../../api', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  return {apiAtom: createAtom({chat: {}, notification: {}})}
})

jest.mock('../../tradeChecklist/atoms/fromChatAtoms', () => {
  const {atom: createAtom} = jest.requireActual('jotai')
  return {tradeChecklistDataAtom: createAtom({identity: {}, contact: {}})}
})

jest.mock('@vexl-next/resources-utils/src/chat/sendMessage', () => {
  const {Effect: TestEffect} = jest.requireActual('effect')
  return {
    __esModule: true,
    default: jest.fn(() =>
      TestEffect.succeed({receivedByServerAt: 1789470000000})
    ),
  }
})

jest.mock('./scheduleTradeReminderIfNeeded', () => ({
  scheduleTradeReminderIfNeeded: () => (chat: ChatWithMessages) => chat,
}))

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock(
  'url-join',
  () =>
    (...parts: string[]) =>
      parts.join('/')
)

const timestamp = Schema.decodeUnknownSync(UnixMilliseconds)(1789470000000)
const requesterPhone =
  Schema.decodeUnknownSync(E164PhoneNumber)('+420777111222')
const responderPhone =
  Schema.decodeUnknownSync(E164PhoneNumber)('+420777333444')

function revealUpdate(
  status: 'REQUEST_REVEAL' | 'APPROVE_REVEAL' | 'DISAPPROVE_REVEAL',
  name: string,
  fullPhoneNumber: E164PhoneNumber
): TradeChecklistUpdate {
  return {
    identity: {
      status,
      timestamp,
      deanonymizedUser: {
        name: Schema.decodeUnknownSync(UserName)(name),
        partialPhoneNumber: '+420******222',
      },
    },
    contact: {status, timestamp, fullPhoneNumber},
  }
}

function freshChat(): ChatWithMessages {
  return {
    ...dummyChatWithMessages,
    messages: [],
    tradeChecklist: createEmptyTradeChecklistInState(),
  }
}

function received(update: TradeChecklistUpdate): ChatMessageWithState {
  return {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      messageType: 'TRADE_CHECKLIST_UPDATE',
      senderPublicKey: dummyChatWithMessages.chat.otherSide.publicKey,
      text: 'Checklist updated',
      time: timestamp,
      tradeChecklistUpdate: update,
    },
  }
}

function receive(
  chat: ChatWithMessages,
  ...updates: TradeChecklistUpdate[]
): ChatWithMessages {
  return pipe(
    addMessagesToChats([chat])(map(updates, received)),
    head,
    Option.getOrThrow
  )
}

const request = revealUpdate('REQUEST_REVEAL', 'Alice', requesterPhone)
const approval = revealUpdate('APPROVE_REVEAL', 'Bob', responderPhone)

beforeEach(() => {
  jest.clearAllMocks()
})

it('reveals both phones when the initial identity response also approves phone reveal', async () => {
  const store = createStore()
  const requester = atom(freshChat())
  const requestMessages = await Effect.runPromise(
    store.set(createSubmitChecklistUpdateActionAtom(requester), request)
  )
  const responder = atom(
    receive(
      freshChat(),
      ...filterMap(requestMessages, (message) =>
        message.state === 'receivedButRequiresNewerVersion'
          ? Option.none()
          : Option.fromNullable(message.message.tradeChecklistUpdate)
      )
    )
  )

  expect(store.get(responder).chat.otherSide.realLifeInfo).toBeUndefined()

  store.set(tradeChecklistDataAtom, store.get(responder).tradeChecklist)
  const responseMessages = await Effect.runPromise(
    store.set(createSubmitChecklistUpdateActionAtom(responder), approval)
  )
  const responderInfo = store.get(responder).chat.otherSide.realLifeInfo
  expect(responderInfo?.userName).toBe('Alice')
  expect(responderInfo?.fullPhoneNumber).toBe(requesterPhone)

  const [requesterAfterResponse] = addMessagesToChats([store.get(requester)])(
    map(
      responseMessages,
      (message): ChatMessageWithState =>
        message.state === 'receivedButRequiresNewerVersion'
          ? message
          : {...message, state: 'received'}
    )
  )
  expect(requesterAfterResponse?.chat.otherSide.realLifeInfo?.userName).toBe(
    'Bob'
  )
  expect(
    requesterAfterResponse?.chat.otherSide.realLifeInfo?.fullPhoneNumber
  ).toBe(responderPhone)
  expect(sendMessage).toHaveBeenCalledTimes(4)
})

it.each(['identity first', 'contact first', 'same batch'])(
  'keeps an approved phone when identity and contact arrive %s',
  (delivery) => {
    const identity = {identity: approval.identity}
    const contact = {contact: approval.contact}
    const chat =
      delivery === 'same batch'
        ? receive(freshChat(), contact, identity)
        : delivery === 'identity first'
          ? receive(receive(freshChat(), identity), contact)
          : receive(receive(freshChat(), contact), identity)

    expect(chat.chat.otherSide.realLifeInfo?.userName).toBe('Bob')
    expect(chat.chat.otherSide.realLifeInfo?.fullPhoneNumber).toBe(
      responderPhone
    )
  }
)

it.each(['omit', 'decline'])(
  'does not reveal the requested phone when the identity response chooses to %s it',
  async (choice) => {
    const store = createStore()
    const chat = atom(receive(freshChat(), request))
    store.set(tradeChecklistDataAtom, store.get(chat).tradeChecklist)
    await Effect.runPromise(
      store.set(createSubmitChecklistUpdateActionAtom(chat), {
        identity: approval.identity,
        ...(choice === 'decline'
          ? {
              contact: {
                ...approval.contact,
                timestamp,
                status: 'DISAPPROVE_REVEAL',
              },
            }
          : {}),
      })
    )
    expect(store.get(chat).chat.otherSide.realLifeInfo?.userName).toBe('Alice')
    expect(
      store.get(chat).chat.otherSide.realLifeInfo?.fullPhoneNumber
    ).toBeUndefined()

    const sentContacts = pipe(
      jest.mocked(sendMessage).mock.calls,
      filterMap(([{message}]) =>
        Option.fromNullable(message.tradeChecklistUpdate?.contact)
      )
    )
    if (choice === 'decline') {
      expect(sentContacts).toEqual([{status: 'DISAPPROVE_REVEAL', timestamp}])
    } else {
      expect(sentContacts).toEqual([])
    }
  }
)

it('does not reveal a phone included in a declined incoming contact update', () => {
  const chat = receive(
    {
      ...freshChat(),
      tradeChecklist: {
        ...createEmptyTradeChecklistInState(),
        contact: {sent: approval.contact},
      },
    },
    {identity: approval.identity},
    {
      contact: {
        ...approval.contact,
        timestamp,
        status: 'DISAPPROVE_REVEAL',
      },
    }
  )
  expect(chat.chat.otherSide.realLifeInfo?.userName).toBe('Bob')
  expect(chat.chat.otherSide.realLifeInfo?.fullPhoneNumber).toBeUndefined()
})

it('stores a phone revealed on its own in a fresh chat', () => {
  const chat = receive(
    {
      ...freshChat(),
      tradeChecklist: {
        ...createEmptyTradeChecklistInState(),
        contact: {
          sent: {...request.contact, timestamp, status: 'REQUEST_REVEAL'},
        },
      },
    },
    {contact: approval.contact}
  )
  expect(chat.chat.otherSide.realLifeInfo?.userName).toBeUndefined()
  expect(chat.chat.otherSide.realLifeInfo?.fullPhoneNumber).toBe(responderPhone)
})

it('preserves an already revealed phone without checklist contact history', () => {
  const previouslyRevealed = {
    ...receive(freshChat(), approval),
    tradeChecklist: createEmptyTradeChecklistInState(),
  }
  expect(receive(previouslyRevealed, {}).chat.otherSide.realLifeInfo).toEqual(
    previouslyRevealed.chat.otherSide.realLifeInfo
  )
  const refreshed = receive(previouslyRevealed, {identity: approval.identity})
  expect(refreshed.chat.otherSide.realLifeInfo?.fullPhoneNumber).toBe(
    responderPhone
  )
})

function chatWithEarlierApprovals(): ChatWithMessages {
  return {
    ...freshChat(),
    tradeChecklist: {
      ...createEmptyTradeChecklistInState(),
      identity: {sent: approval.identity},
      contact: {sent: approval.contact},
    },
  }
}

it('does not reuse earlier sent approvals to reveal a new incoming request', () => {
  const chat = receive(chatWithEarlierApprovals(), request)
  expect(chat.chat.otherSide.realLifeInfo).toBeUndefined()
})

it.each(['unrelated', 'identity only'])(
  'keeps the previously revealed phone when a new request is followed by an %s send',
  async (choice) => {
    const store = createStore()
    const earlier = receive(chatWithEarlierApprovals(), approval)
    const chat = atom(receive(earlier, request))
    expect(store.get(chat).chat.otherSide.realLifeInfo).toEqual(
      earlier.chat.otherSide.realLifeInfo
    )
    store.set(tradeChecklistDataAtom, store.get(chat).tradeChecklist)

    await Effect.runPromise(
      store.set(
        createSubmitChecklistUpdateActionAtom(chat),
        choice === 'identity only'
          ? {identity: approval.identity}
          : {network: {timestamp}}
      )
    )

    expect(store.get(chat).chat.otherSide.realLifeInfo?.userName).toBe(
      choice === 'identity only' ? 'Alice' : 'Bob'
    )
    expect(store.get(chat).chat.otherSide.realLifeInfo?.fullPhoneNumber).toBe(
      responderPhone
    )
  }
)

it('reveals a later request when the current send explicitly approves it', async () => {
  const store = createStore()
  const chat = atom(receive(chatWithEarlierApprovals(), request))
  store.set(tradeChecklistDataAtom, store.get(chat).tradeChecklist)

  await Effect.runPromise(
    store.set(createSubmitChecklistUpdateActionAtom(chat), approval)
  )

  expect(store.get(chat).chat.otherSide.realLifeInfo?.userName).toBe('Alice')
  expect(store.get(chat).chat.otherSide.realLifeInfo?.fullPhoneNumber).toBe(
    requesterPhone
  )
})

it('approves the captured request when another request arrives during the send', async () => {
  const store = createStore()
  const chat = atom(receive(freshChat(), request))
  store.set(tradeChecklistDataAtom, store.get(chat).tradeChecklist)
  const originalSend = pipe(
    jest.mocked(sendMessage).getMockImplementation(),
    Option.fromNullable,
    Option.getOrThrow
  )
  let releaseSend = (): void => undefined
  const blockedSend = new Promise<void>((resolve) => {
    releaseSend = resolve
  })
  let signalStarted = (): void => undefined
  const sendStarted = new Promise<void>((resolve) => {
    signalStarted = resolve
  })
  jest.mocked(sendMessage).mockImplementationOnce((args) =>
    pipe(
      Effect.sync(signalStarted),
      Effect.andThen(
        Effect.promise(async () => {
          await blockedSend
        })
      ),
      Effect.andThen(originalSend(args))
    )
  )

  const sending = Effect.runPromise(
    store.set(createSubmitChecklistUpdateActionAtom(chat), approval)
  )
  await sendStarted
  const replacement = revealUpdate('REQUEST_REVEAL', 'Carol', responderPhone)
  store.set(chat, receive(store.get(chat), replacement))
  expect(store.get(chat).chat.otherSide.realLifeInfo).toBeUndefined()
  releaseSend()
  await sending

  expect(store.get(chat).tradeChecklist.identity.received).toEqual(
    replacement.identity
  )
  expect(store.get(chat).chat.otherSide.realLifeInfo?.userName).toBe('Alice')
  expect(store.get(chat).chat.otherSide.realLifeInfo?.fullPhoneNumber).toBe(
    requesterPhone
  )
})
