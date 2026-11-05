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

function message({
  uuid,
  time,
  receivedByServerAt,
}: {
  uuid: string
  time: number
  receivedByServerAt?: number
}): ChatMessageWithState {
  const chatMessage: ChatMessage = {
    uuid: chatMessageId(uuid),
    text: 'Message',
    time: unixMilliseconds(time),
    messageType: 'MESSAGE',
    senderPublicKey,
  }

  return {
    state: 'received',
    message: chatMessage,
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
})
