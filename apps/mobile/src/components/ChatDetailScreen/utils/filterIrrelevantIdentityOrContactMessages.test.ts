import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  generateChatMessageId,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema, pipe} from 'effect'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {type TradeChecklistInState} from '../../../state/tradeChecklist/domain'
import filterIrrelevantIdentityOrContactMessages from './filterIrrelevantIdentityOrContactMessages'

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

it('hides phone reveal request when identity reveal is still pending', () => {
  const identityRequest = chatMessage({
    messageType: 'TRADE_CHECKLIST_UPDATE',
    state: 'received',
    time: 1,
    tradeChecklistUpdate: {
      identity: {
        status: 'REQUEST_REVEAL',
        timestamp: timestamp(1),
      },
    },
  })
  const contactRequest = chatMessage({
    messageType: 'TRADE_CHECKLIST_UPDATE',
    state: 'received',
    time: 1,
    tradeChecklistUpdate: {
      contact: {
        status: 'REQUEST_REVEAL',
        fullPhoneNumber: phoneNumber('+420777777777'),
        timestamp: timestamp(1),
      },
    },
  })

  const messages = [identityRequest, contactRequest]
  const visibleMessages = pipe(
    messages,
    Array.filter(
      filterIrrelevantIdentityOrContactMessages(messages, emptyTradeChecklist())
    )
  )

  expect(visibleMessages).toEqual([identityRequest])
})

it('keeps post-identity phone prompt attached to identity reveal', () => {
  const contactRequest = chatMessage({
    messageType: 'TRADE_CHECKLIST_UPDATE',
    state: 'received',
    time: 1,
    tradeChecklistUpdate: {
      contact: {
        status: 'REQUEST_REVEAL',
        fullPhoneNumber: phoneNumber('+420777777777'),
        timestamp: timestamp(1),
      },
    },
  })
  const identityApproval = chatMessage({
    messageType: 'TRADE_CHECKLIST_UPDATE',
    state: 'sent',
    time: 2,
    tradeChecklistUpdate: {
      identity: {
        status: 'APPROVE_REVEAL',
        timestamp: timestamp(2),
      },
    },
  })

  const tradeChecklist: TradeChecklistInState = {
    ...emptyTradeChecklist(),
    identity: {
      sent: {
        status: 'APPROVE_REVEAL',
        timestamp: timestamp(2),
      },
    },
    contact: {
      received: {
        status: 'REQUEST_REVEAL',
        fullPhoneNumber: phoneNumber('+420777777777'),
        timestamp: timestamp(1),
      },
    },
  }
  const messages = [contactRequest, identityApproval]
  const visibleMessages = pipe(
    messages,
    Array.filter(
      filterIrrelevantIdentityOrContactMessages(messages, tradeChecklist)
    )
  )

  expect(visibleMessages).toEqual([identityApproval])
})
