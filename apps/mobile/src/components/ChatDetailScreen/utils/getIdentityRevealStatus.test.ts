import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {type TradeChecklistInState} from '../../../state/tradeChecklist/domain'
import getIdentityRevealStatus from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'

const senderPublicKey = generatePrivateKey().publicKeyPemBase64

function timestamp(value: number): Schema.Schema.Type<typeof UnixMilliseconds> {
  return Schema.decodeSync(UnixMilliseconds)(value)
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

it('uses a newer received identity request after an older rejection', () => {
  const myRequest = chatMessage({
    messageType: 'REQUEST_REVEAL',
    state: 'sent',
    time: 1,
  })
  const theirRejection = chatMessage({
    messageType: 'DISAPPROVE_REVEAL',
    state: 'received',
    time: 2,
  })
  const theirRequest = chatMessage({
    messageType: 'REQUEST_REVEAL',
    state: 'received',
    time: 3,
  })

  expect(
    getIdentityRevealStatus({
      messages: [myRequest, theirRejection, theirRequest],
      tradeChecklist: emptyTradeChecklist(),
    })
  ).toBe('theyAsked')
})

it('uses a newer received identity request after I rejected an older request', () => {
  const theirRequest = chatMessage({
    messageType: 'REQUEST_REVEAL',
    state: 'received',
    time: 1,
  })
  const myRejection = chatMessage({
    messageType: 'DISAPPROVE_REVEAL',
    state: 'sent',
    time: 2,
  })
  const theirNewerRequest = chatMessage({
    messageType: 'REQUEST_REVEAL',
    state: 'received',
    time: 3,
  })

  expect(
    getIdentityRevealStatus({
      messages: [theirRequest, myRejection, theirNewerRequest],
      tradeChecklist: emptyTradeChecklist(),
    })
  ).toBe('theyAsked')
})

it('uses the newest trade checklist identity update by timestamp', () => {
  expect(
    getIdentityRevealStatus({
      messages: [],
      tradeChecklist: {
        ...emptyTradeChecklist(),
        identity: {
          sent: {
            status: 'DISAPPROVE_REVEAL',
            timestamp: timestamp(1),
          },
          received: {
            status: 'REQUEST_REVEAL',
            timestamp: timestamp(2),
          },
        },
      },
    })
  ).toBe('theyAsked')
})

it('uses a newer received identity request after an older approval', () => {
  const myApproval = chatMessage({
    messageType: 'APPROVE_REVEAL',
    state: 'sent',
    time: 1,
  })
  const theirRequest = chatMessage({
    messageType: 'REQUEST_REVEAL',
    state: 'received',
    time: 2,
  })

  expect(
    getIdentityRevealStatus({
      messages: [myApproval, theirRequest],
      tradeChecklist: emptyTradeChecklist(),
    })
  ).toBe('theyAsked')
})

it('does not keep older trade checklist approvals after a newer request', () => {
  expect(
    getIdentityRevealStatus({
      messages: [],
      tradeChecklist: {
        ...emptyTradeChecklist(),
        identity: {
          sent: {
            status: 'APPROVE_REVEAL',
            timestamp: timestamp(1),
          },
          received: {
            status: 'REQUEST_REVEAL',
            timestamp: timestamp(2),
          },
        },
      },
    })
  ).toBe('theyAsked')
})

it('uses newer trade checklist state over older legacy approval messages', () => {
  const myApproval = chatMessage({
    messageType: 'APPROVE_REVEAL',
    state: 'sent',
    time: 1,
  })

  expect(
    getIdentityRevealStatus({
      messages: [myApproval],
      tradeChecklist: {
        ...emptyTradeChecklist(),
        identity: {
          received: {
            status: 'REQUEST_REVEAL',
            timestamp: timestamp(2),
          },
        },
      },
    })
  ).toBe('theyAsked')
})
