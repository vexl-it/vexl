import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatMessage,
  ChatMessagePayload,
  MessageCypher,
  ServerMessage,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {type QuickConnectAmount} from '@vexl-next/domain/src/general/quickOffers'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Either, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {parseChatMessage} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

const senderKeyPair = generatePrivateKey()
const appVersion = Schema.decodeSync(VersionString)('1.0.0')

const serializeRequest = (quickConnectAmount?: QuickConnectAmount): string => {
  const serialized = serializeChatMessage(
    Schema.decodeSync(ChatMessage)({
      uuid: generateChatMessageId(),
      text: '',
      time: now(),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
      messageType: 'REQUEST_MESSAGING',
      myVersion: appVersion,
      quickConnectAmount,
    })
  )
  if (!Either.isRight(serialized))
    throw new Error(`Failed to serialize message: ${serialized.left._tag}`)
  return serialized.right
}

const parse = (json: string): ChatMessage => {
  const parsed = parseChatMessage({
    appVersion,
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('request-message-cypher'),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
    }),
  })(json)
  if (!E.isRight(parsed))
    throw new Error(`Failed to parse message: ${parsed.left._tag}`)
  return parsed.right
}

it.each<QuickConnectAmount>([
  {_tag: 'BtcAmount', btc: 0.015},
  {_tag: 'FiatAmount', amount: 500, currency: 'CZK'},
])('keeps the quick connect amount %o through the payload', (amount) => {
  expect(parse(serializeRequest(amount)).quickConnectAmount).toEqual(amount)
})

it('leaves the quick connect amount out when none is given', () => {
  expect(parse(serializeRequest()).quickConnectAmount).toBeUndefined()
})

it('decodes on clients that do not know the quick connect amount', () => {
  const PayloadOfOlderClient = ChatMessagePayload.omit('quickConnectAmount')
  const decoded = Schema.decodeUnknownEither(
    Schema.parseJson(PayloadOfOlderClient)
  )(serializeRequest({_tag: 'BtcAmount', btc: 1}))

  expect(Either.isRight(decoded)).toBe(true)
})
