import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateChatMessageId,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {type ChatMessageWithState} from '../../chat/domain'
import {type TradeChecklistInState} from '../domain'
import getContactRevealStatus from './getContactRevealStatus'

const senderPublicKey = generatePrivateKey().publicKeyPemBase64

function timestamp(value: number): Schema.Schema.Type<typeof UnixMilliseconds> {
  return Schema.decodeSync(UnixMilliseconds)(value)
}

function phoneNumber(
  value: string
): Schema.Schema.Type<typeof E164PhoneNumber> {
  return Schema.decodeSync(E164PhoneNumber)(value)
}

function chatMessage({
  messageType,
  state,
  time,
  tradeChecklistUpdate,
}: {
  messageType: MessageType
  state: 'sent' | 'received'
  time: number
  tradeChecklistUpdate?: TradeChecklistUpdate
}): ChatMessageWithState {
  const message = {
    uuid: generateChatMessageId(),
    text: '',
    time: timestamp(time),
    senderPublicKey,
    messageType,
    ...(tradeChecklistUpdate ? {tradeChecklistUpdate} : {}),
  }

  if (state === 'received') {
    return {
      state: 'received',
      message,
    }
  }

  return {
    state: 'sent',
    message,
  }
}

function emptyTradeChecklist(): TradeChecklistInState {
  return {
    dateAndTime: {},
    location: {},
    amount: {},
    network: {},
    identity: {},
    contact: {},
  }
}

it('uses a newer received phone request after I rejected an older request', () => {
  const theirRequest = chatMessage({
    messageType: 'REQUEST_CONTACT_REVEAL',
    state: 'received',
    time: 1,
  })
  const myRejection = chatMessage({
    messageType: 'DISAPPROVE_CONTACT_REVEAL',
    state: 'sent',
    time: 2,
  })
  const theirNewerRequest = chatMessage({
    messageType: 'REQUEST_CONTACT_REVEAL',
    state: 'received',
    time: 3,
  })

  expect(
    getContactRevealStatus({
      messages: [theirRequest, myRejection, theirNewerRequest],
      tradeChecklist: emptyTradeChecklist(),
    })
  ).toBe('theyAsked')
})

it('uses the newest trade checklist phone update by timestamp', () => {
  expect(
    getContactRevealStatus({
      messages: [],
      tradeChecklist: {
        ...emptyTradeChecklist(),
        contact: {
          sent: {
            status: 'DISAPPROVE_REVEAL',
            timestamp: timestamp(2),
          },
          received: {
            status: 'REQUEST_REVEAL',
            fullPhoneNumber: phoneNumber('+420733333333'),
            timestamp: timestamp(3),
          },
        },
      },
    })
  ).toBe('theyAsked')
})

it('keeps phone reveal shared only when both phone numbers are present', () => {
  const messages = [
    chatMessage({
      messageType: 'APPROVE_CONTACT_REVEAL',
      state: 'received',
      time: 3,
    }),
  ]

  expect(
    getContactRevealStatus({
      messages,
      tradeChecklist: emptyTradeChecklist(),
    })
  ).toBe('theyAsked')

  expect(
    getContactRevealStatus({
      messages,
      tradeChecklist: {
        ...emptyTradeChecklist(),
        contact: {
          sent: {
            status: 'REQUEST_REVEAL',
            fullPhoneNumber: phoneNumber('+420733333344'),
            timestamp: timestamp(1),
          },
          received: {
            status: 'APPROVE_REVEAL',
            fullPhoneNumber: phoneNumber('+420733333333'),
            timestamp: timestamp(3),
          },
        },
      },
    })
  ).toBe('shared')
})
