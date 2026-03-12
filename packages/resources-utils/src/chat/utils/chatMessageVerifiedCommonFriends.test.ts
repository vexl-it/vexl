import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ChatMessage,
  MessageCypher,
  ServerMessage,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Either, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {parseChatMessage} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

it('preserves verified common friends in request messaging payloads', () => {
  const senderKeyPair = generatePrivateKey()
  const commonFriend = Schema.decodeSync(HashedPhoneNumber)('common-friend')
  const verifiedCommonFriend = Schema.decodeSync(HashedPhoneNumber)(
    'verified-common-friend'
  )
  const appVersion = Schema.decodeSync(SemverString)('1.0.0')

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

  expect(Either.isRight(serialized)).toBe(true)
  if (!Either.isRight(serialized)) {
    throw new Error(`Failed to serialize message: ${serialized.left._tag}`)
  }

  const parsed = parseChatMessage({
    appVersion,
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('request-message-cypher'),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
    }),
  })(serialized.right)

  expect(E.isRight(parsed)).toBe(true)
  if (!E.isRight(parsed)) {
    throw new Error(`Failed to parse message: ${parsed.left._tag}`)
  }

  expect(parsed.right.commonFriends).toEqual([commonFriend])
  expect(parsed.right.verifiedCommonFriends).toEqual([verifiedCommonFriend])
})
