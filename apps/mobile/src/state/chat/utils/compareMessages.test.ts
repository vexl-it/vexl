import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {type ChatMessageWithState} from '../domain'
import compareMessages from './compareMessages'

const senderPublicKey = generatePrivateKey().publicKeyPemBase64

function unixMilliseconds(value: number): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(value)
}

function chatMessageId(value: string): ChatMessageId {
  return Schema.decodeSync(ChatMessageId)(value)
}

function chatMessage({uuid, time}: {uuid: string; time: number}): ChatMessage {
  return {
    uuid: chatMessageId(uuid),
    text: 'Message',
    time: unixMilliseconds(time),
    messageType: 'MESSAGE',
    senderPublicKey,
  }
}

function message({
  uuid,
  time,
  receivedByServerAt,
}: {
  uuid: string
  time: number
  receivedByServerAt?: number
}): ChatMessageWithState {
  return {
    state: 'received',
    message: chatMessage({uuid, time}),
    receivedByServerAt:
      receivedByServerAt === undefined
        ? undefined
        : unixMilliseconds(receivedByServerAt),
  }
}

describe('compareMessages', () => {
  it('orders by server timestamps when present', () => {
    const earlier = message({
      uuid: '00000000-0000-4000-8000-000000000001',
      time: 300,
      receivedByServerAt: 100,
    })
    const later = message({
      uuid: '00000000-0000-4000-8000-000000000002',
      time: 200,
      receivedByServerAt: 200,
    })

    expect([later, earlier].sort(compareMessages)).toEqual([earlier, later])
  })

  it('falls back to message time for old messages', () => {
    const earlier = message({
      uuid: '00000000-0000-4000-8000-000000000001',
      time: 100,
    })
    const later = message({
      uuid: '00000000-0000-4000-8000-000000000002',
      time: 200,
    })

    expect([later, earlier].sort(compareMessages)).toEqual([earlier, later])
  })

  it('orders deterministically by uuid when timestamps match', () => {
    const first = message({
      uuid: '00000000-0000-4000-8000-000000000001',
      time: 100,
      receivedByServerAt: 200,
    })
    const second = message({
      uuid: '00000000-0000-4000-8000-000000000002',
      time: 100,
      receivedByServerAt: 200,
    })

    expect([second, first].sort(compareMessages)).toEqual([first, second])
  })

  it('handles clock drift where message time differs from server order', () => {
    const receivedFirst = message({
      uuid: '00000000-0000-4000-8000-000000000001',
      time: 2_000,
      receivedByServerAt: 100,
    })
    const receivedSecond = message({
      uuid: '00000000-0000-4000-8000-000000000002',
      time: 1_000,
      receivedByServerAt: 200,
    })

    expect([receivedSecond, receivedFirst].sort(compareMessages)).toEqual([
      receivedFirst,
      receivedSecond,
    ])
  })

  it('keeps sending messages after acknowledged ones even when the local clock is behind', () => {
    const sent: ChatMessageWithState = {
      state: 'sent',
      message: chatMessage({
        uuid: '00000000-0000-4000-8000-000000000001',
        time: 100,
      }),
      receivedByServerAt: unixMilliseconds(500),
    }
    const sending: ChatMessageWithState = {
      state: 'sending',
      message: chatMessage({
        uuid: '00000000-0000-4000-8000-000000000002',
        time: 101,
      }),
    }
    const nextSending: ChatMessageWithState = {
      state: 'sending',
      message: chatMessage({
        uuid: '00000000-0000-4000-8000-000000000003',
        time: 102,
      }),
    }

    expect(
      [nextSending, sending, sent].sort(compareMessages).map((m) => m.state)
    ).toEqual(['sent', 'sending', 'sending'])
    expect(compareMessages(sending, nextSending)).toBe(-1)
  })
})
