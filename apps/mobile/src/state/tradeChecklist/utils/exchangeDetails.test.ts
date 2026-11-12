import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {
  type ContactRevealChatMessage,
  type IdentityRevealChatMessage,
  type RevealStatus,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, Schema} from 'effect'
import {
  dummyChatWithMessages,
  type ChatMessageWithState,
} from '../../chat/domain'
import anonymizePhoneNumber from '../../chat/utils/anonymizePhoneNumber'
import {createEmptyTradeChecklistInState} from '../domain'
import {updateTradeChecklistState} from '../utils'
import {
  defaultPhoneNumberToReveal,
  exchangedDetails,
  exchangedDetailsForEvent,
  latestReveal,
  myRevealedPhoneNumberForEvent,
  pendingRequestFromThem,
  revealEventForMessage,
  revealFromSelection,
  selectionFromReveal,
  stillPendingDetails,
  type RevealUpdate,
} from './exchangeDetails'

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

const at = (ms: number): UnixMilliseconds =>
  Schema.decodeUnknownSync(UnixMilliseconds)(ms)
const name = Schema.decodeUnknownSync(UserName)('Alice')
const phone = Schema.decodeUnknownSync(E164PhoneNumber)('+420777111222')
const photo = Schema.decodeUnknownSync(UriString)('file:///photo.jpg')

function identity(
  status: RevealStatus,
  timestamp: number,
  data: {name?: boolean; photo?: boolean} = {name: true}
): IdentityRevealChatMessage {
  return {
    status,
    timestamp: at(timestamp),
    deanonymizedUser: data.name
      ? {name, partialPhoneNumber: '+420***'}
      : undefined,
    image: data.photo ? photo : undefined,
  }
}

function contact(
  status: RevealStatus,
  timestamp: number
): ContactRevealChatMessage {
  return {
    status,
    timestamp: at(timestamp),
    fullPhoneNumber: status === 'DISAPPROVE_REVEAL' ? undefined : phone,
  }
}

function message(
  state: 'sent' | 'received',
  update: RevealUpdate,
  time: number
): ChatMessageWithState {
  return {
    state,
    message: {
      uuid: generateChatMessageId(),
      messageType: 'TRADE_CHECKLIST_UPDATE',
      senderPublicKey: dummyChatWithMessages.chat.otherSide.publicKey,
      text: 'Checklist updated',
      time: at(time),
      tradeChecklistUpdate: update,
    },
  }
}

function chatWith(
  messages: ChatMessageWithState[]
): typeof dummyChatWithMessages {
  const tradeChecklist = messages.reduce(
    (state, one) =>
      (one.state === 'sent' || one.state === 'received') &&
      one.message.tradeChecklistUpdate
        ? updateTradeChecklistState(state)({
            update: one.message.tradeChecklistUpdate,
            direction: one.state,
          })
        : state,
    createEmptyTradeChecklistInState()
  )
  return {...dummyChatWithMessages, messages, tradeChecklist}
}

it('offers nothing on a decline', () => {
  expect(
    selectionFromReveal({
      identity: identity('DISAPPROVE_REVEAL', 1, {name: true, photo: true}),
      contact: contact('DISAPPROVE_REVEAL', 1),
    })
  ).toEqual({nickname: false, photo: false, phoneNumber: false})
})

it('renders identity and contact sent together as one event', () => {
  const contactUpdate = contact('REQUEST_REVEAL', 1)
  const identityMessage = message(
    'sent',
    {identity: identity('REQUEST_REVEAL', 1)},
    1
  )
  const contactMessage = message('sent', {contact: contactUpdate}, 2)
  const chat = chatWith([identityMessage, contactMessage])

  expect(revealEventForMessage(chat, contactMessage)).toBeUndefined()
  expect(revealEventForMessage(chat, identityMessage)?.reveal.contact).toEqual(
    contactUpdate
  )
})

it('reports what they asked for until I answer', () => {
  const request = message(
    'received',
    {
      identity: identity('REQUEST_REVEAL', 1),
      contact: contact('REQUEST_REVEAL', 1),
    },
    1
  )
  const asked = chatWith([request])

  expect(pendingRequestFromThem(asked)).toEqual({
    nickname: true,
    photo: false,
    phoneNumber: true,
  })

  const answered = chatWith([
    request,
    message('sent', {identity: identity('APPROVE_REVEAL', 2)}, 2),
    message('sent', {contact: contact('DISAPPROVE_REVEAL', 2)}, 3),
  ])
  expect(pendingRequestFromThem(answered)).toEqual({
    nickname: false,
    photo: false,
    phoneNumber: false,
  })
  const requestEvent = revealEventForMessage(answered, request)
  expect(requestEvent && stillPendingDetails(answered, requestEvent)).toEqual({
    nickname: false,
    photo: false,
    phoneNumber: false,
  })
})

it('keeps only the unanswered part of a request pending', () => {
  const request = message(
    'sent',
    {
      identity: identity('REQUEST_REVEAL', 1),
      contact: contact('REQUEST_REVEAL', 1),
    },
    1
  )
  const chat = chatWith([
    request,
    message('received', {identity: identity('APPROVE_REVEAL', 2)}, 2),
  ])
  const event = revealEventForMessage(chat, request)

  expect(event && stillPendingDetails(chat, event)).toEqual({
    nickname: false,
    photo: false,
    phoneNumber: true,
  })
})

it('treats an answer as newer by message order even when its clock runs behind', () => {
  const request = message(
    'sent',
    {identity: identity('REQUEST_REVEAL', 1000)},
    1000
  )
  const chat = chatWith([
    request,
    message('received', {identity: identity('APPROVE_REVEAL', 500)}, 500),
  ])
  const event = revealEventForMessage(chat, request)

  expect(event && stillPendingDetails(chat, event)).toEqual({
    nickname: false,
    photo: false,
    phoneNumber: false,
  })
})

it('scopes an outcome to the groups of its own event', () => {
  const chat = chatWith([
    message('sent', {identity: identity('REQUEST_REVEAL', 1)}, 1),
    message('received', {identity: identity('APPROVE_REVEAL', 2)}, 2),
    message('sent', {contact: contact('REQUEST_REVEAL', 3)}, 3),
    message('received', {contact: contact('DISAPPROVE_REVEAL', 4)}, 4),
  ])
  const decline = chat.messages[3]
  const event = decline && revealEventForMessage(chat, decline)

  expect(event && exchangedDetailsForEvent(chat, event)).toEqual({
    mine: {nickname: false, photo: false, phoneNumber: false},
    theirs: {nickname: false, photo: false, phoneNumber: false},
  })
})

it('counts a group as exchanged only when both sides offered it', () => {
  const chat = chatWith([
    message(
      'sent',
      {
        identity: identity('REQUEST_REVEAL', 1, {name: true, photo: true}),
        contact: contact('REQUEST_REVEAL', 1),
      },
      1
    ),
    message('received', {identity: identity('APPROVE_REVEAL', 2)}, 2),
    message('received', {contact: contact('DISAPPROVE_REVEAL', 2)}, 3),
  ])

  expect(
    exchangedDetails({
      sent: latestReveal({chat, direction: 'sent'}),
      received: latestReveal({chat, direction: 'received'}),
    })
  ).toEqual({
    mine: {nickname: true, photo: true, phoneNumber: false},
    theirs: {nickname: true, photo: false, phoneNumber: false},
  })
})

it('maps legacy reveal messages onto the same shape', () => {
  const legacy: ChatMessageWithState = {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      messageType: 'REQUEST_REVEAL',
      senderPublicKey: dummyChatWithMessages.chat.otherSide.publicKey,
      text: '',
      time: at(5),
      deanonymizedUser: {name, partialPhoneNumber: '+420***'},
    },
  }
  const chat = {...dummyChatWithMessages, messages: [legacy]}

  expect(pendingRequestFromThem(chat)).toEqual({
    nickname: true,
    photo: false,
    phoneNumber: false,
  })
})

describe('phone number of a multi-number account', () => {
  const main = Schema.decodeUnknownSync(E164PhoneNumber)('+420733733733')
  const extra = Schema.decodeUnknownSync(E164PhoneNumber)('+421905123456')
  const removed = Schema.decodeUnknownSync(E164PhoneNumber)('+48500600700')
  const accountPhoneNumbers = Array.make(main, extra)

  const identityWith = (
    phoneNumber: E164PhoneNumber,
    timestamp: number
  ): IdentityRevealChatMessage => ({
    status: 'REQUEST_REVEAL',
    timestamp: at(timestamp),
    deanonymizedUser: {
      name,
      partialPhoneNumber: anonymizePhoneNumber(phoneNumber),
    },
  })
  const contactWith = (
    phoneNumber: E164PhoneNumber,
    timestamp: number
  ): ContactRevealChatMessage => ({
    status: 'REQUEST_REVEAL',
    timestamp: at(timestamp),
    fullPhoneNumber: phoneNumber,
  })

  it('reveals the same number in the nickname and in the contact', () => {
    const reveal = revealFromSelection({
      selection: {nickname: true, phoneNumber: true, photo: false},
      requested: {nickname: false, phoneNumber: false, photo: false},
      name,
      photo: undefined,
      phoneNumber: extra,
      timestamp: at(1),
    })

    expect(reveal.contact?.fullPhoneNumber).toBe(extra)
    expect(reveal.identity?.deanonymizedUser?.partialPhoneNumber).toBe(
      anonymizePhoneNumber(extra)
    )
  })

  it('defaults to the main number in a chat that got none yet', () => {
    expect(
      defaultPhoneNumberToReveal({
        accountPhoneNumbers,
        chat: chatWith([]),
        draft: {},
      })
    ).toBe(main)
  })

  it('defaults to the number this chat already got', () => {
    const chat = chatWith([
      message('sent', {identity: identityWith(extra, 1)}, 1),
    ])

    expect(
      defaultPhoneNumberToReveal({accountPhoneNumbers, chat, draft: {}})
    ).toBe(extra)
  })

  it('prefers the number of the unsent draft', () => {
    const chat = chatWith([message('sent', {contact: contactWith(main, 1)}, 1)])

    expect(
      defaultPhoneNumberToReveal({
        accountPhoneNumbers,
        chat,
        draft: {contact: contactWith(extra, 2)},
      })
    ).toBe(extra)
  })

  it('defaults to the main number when the sent one left the account', () => {
    const chat = chatWith([
      message('sent', {contact: contactWith(removed, 1)}, 1),
    ])

    expect(
      defaultPhoneNumberToReveal({accountPhoneNumbers, chat, draft: {}})
    ).toBe(main)
  })

  it('shows the number that was sent, also after it left the account', () => {
    const sent = message(
      'sent',
      {identity: identityWith(removed, 1), contact: contactWith(removed, 1)},
      1
    )
    const answer = message(
      'received',
      {
        identity: {...identityWith(main, 2), status: 'APPROVE_REVEAL'},
        contact: {...contactWith(main, 2), status: 'APPROVE_REVEAL'},
      },
      2
    )
    const chat = chatWith([sent, answer])
    const event = revealEventForMessage(chat, answer)
    if (!event) throw new Error('No event')

    expect(myRevealedPhoneNumberForEvent(chat, event)).toEqual({
      full: removed,
      partial: anonymizePhoneNumber(removed),
    })
  })

  it('shows only what was sent up to the event', () => {
    const first = message('sent', {identity: identityWith(extra, 1)}, 1)
    const later = message('sent', {identity: identityWith(main, 3)}, 3)
    const chat = chatWith([first, later])
    const event = revealEventForMessage(chat, first)
    if (!event) throw new Error('No event')

    expect(myRevealedPhoneNumberForEvent(chat, event)).toEqual({
      full: undefined,
      partial: anonymizePhoneNumber(extra),
    })
  })

  it('has no number for a chat that never got one', () => {
    const answer = message(
      'received',
      {identity: identity('APPROVE_REVEAL', 1)},
      1
    )
    const chat = chatWith([answer])
    const event = revealEventForMessage(chat, answer)
    if (!event) throw new Error('No event')

    expect(myRevealedPhoneNumberForEvent(chat, event)).toEqual({
      full: undefined,
      partial: undefined,
    })
  })
})
