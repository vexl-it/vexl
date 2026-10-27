import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatMessage,
  MessageCypher,
  ServerMessage,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Either, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {parseChatMessage} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

const senderKeyPair = generatePrivateKey()
const reactionsVersion = Schema.decodeSync(VersionString)('26.11.0')
const targetMessageId = generateChatMessageId()

function serializedReaction(emoji: string | undefined): string {
  const serialized = serializeChatMessage(
    Schema.decodeSync(ChatMessage)({
      uuid: generateChatMessageId(),
      text: '',
      time: now(),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
      messageType: 'REACTION',
      myVersion: reactionsVersion,
      minimalRequiredVersion: reactionsVersion,
      reaction: {targetMessageId, emoji},
    })
  )
  if (!Either.isRight(serialized)) {
    throw new Error(`Failed to serialize message: ${serialized.left._tag}`)
  }
  return serialized.right
}

function parse(
  appVersion: string
): ReturnType<ReturnType<typeof parseChatMessage>> {
  return parseChatMessage({
    appVersion: Schema.decodeSync(VersionString)(appVersion),
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('reaction-message-cypher'),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
    }),
  })(serializedReaction('❤️'))
}

it('preserves the reaction through serialization and parsing', () => {
  const parsed = parse('26.11.0')

  if (!E.isRight(parsed)) {
    throw new Error(`Failed to parse message: ${parsed.left._tag}`)
  }
  expect(parsed.right.messageType).toBe('REACTION')
  expect(parsed.right.reaction).toEqual({targetMessageId, emoji: '❤️'})
})

it('preserves a reaction removal (no emoji)', () => {
  const parsed = parseChatMessage({
    appVersion: reactionsVersion,
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('reaction-message-cypher'),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
    }),
  })(serializedReaction(undefined))

  if (!E.isRight(parsed)) {
    throw new Error(`Failed to parse message: ${parsed.left._tag}`)
  }
  expect(parsed.right.reaction).toEqual({targetMessageId})
})

it('marks the reaction as requiring a newer version for older apps', () => {
  const parsed = parse('26.9.5')

  expect(E.isLeft(parsed) && parsed.left._tag).toBe(
    'ErrorChatMessageRequiresNewerVersion'
  )
})
