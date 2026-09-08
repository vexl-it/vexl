import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ChatMessage,
  MessageCypher,
  ServerMessage,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Result, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {parseChatMessage} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

it('preserves verified common friends in request messaging payloads', () => {
  const senderKeyPair = generatePrivateKey()
  const commonFriend = Schema.decodeSync(HashedPhoneNumber)('common-friend')
  const verifiedCommonFriend = Schema.decodeSync(HashedPhoneNumber)(
    'verified-common-friend'
  )
  const appVersion = Schema.decodeSync(VersionString)('1.0.0')

  const message = Schema.decodeSync(ChatMessage)({
    uuid: generateChatMessageId(),
    text: 'hello',
    time: now(),
    senderPublicKey: senderKeyPair.publicKeyPemBase64,
    messageType: 'REQUEST_MESSAGING',
    myVersion: appVersion,
    commonFriends: [commonFriend],
    verifiedCommonFriends: [verifiedCommonFriend],
    friendLevel: ['SECOND_DEGREE'],
  })

  const serialized = serializeChatMessage(message)

  expect(Result.isSuccess(serialized)).toBe(true)
  if (!Result.isSuccess(serialized)) {
    throw new Error(`Failed to serialize message: ${serialized.failure._tag}`)
  }

  const parsed = parseChatMessage({
    appVersion,
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('request-message-cypher'),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
    }),
  })(serialized.success)

  expect(E.isRight(parsed)).toBe(true)
  if (!E.isRight(parsed)) {
    throw new Error(`Failed to parse message: ${parsed.left._tag}`)
  }

  expect(parsed.right.commonFriends).toEqual([commonFriend])
  expect(parsed.right.verifiedCommonFriends).toEqual([verifiedCommonFriend])
})

it.each([
  {minimalRequiredVersion: '99.1.0'},
  {minimalRequiredVersion: '99.1.0', time: 'invalid', uuid: 123, text: 123},
])('retains fallback fields for a message requiring a newer app', (payload) => {
  const parsed = parseChatMessage({
    appVersion: Schema.decodeSync(VersionString)('1.0.0'),
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: 'fixture-cypher',
      senderPublicKey: 'fixture-public-key',
    }),
  })(JSON.stringify(payload))

  expect(E.isLeft(parsed)).toBe(true)
  if (!E.isLeft(parsed)) throw new Error('Expected a newer-version message')
  expect(parsed.left._tag).toBe('ErrorChatMessageRequiresNewerVersion')
  if (parsed.left._tag !== 'ErrorChatMessageRequiresNewerVersion') {
    throw new Error('Expected the newer-version fallback')
  }
  expect(parsed.left.message.text).toBe('-')
  expect(parsed.left.message.uuid).toEqual(expect.any(String))
  expect(parsed.left.message.time).toEqual(expect.any(Number))
})
