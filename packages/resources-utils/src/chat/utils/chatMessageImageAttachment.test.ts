import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatImageAttachment,
  ChatMessage,
  MessageCypher,
  ServerMessage,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Either, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {parseChatMessage} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

const senderKeyPair = generatePrivateKey()
const appVersion = Schema.decodeSync(VersionString)('26.11.0')
const imageAttachment = Schema.decodeSync(ChatImageAttachment)({
  id: generateUuid(),
  key: 'a2V5',
  width: 1920,
  height: 1080,
})

function roundTrip(message: Partial<typeof ChatMessage.Encoded>): ChatMessage {
  const serialized = serializeChatMessage(
    Schema.decodeSync(ChatMessage)({
      uuid: generateChatMessageId(),
      text: '',
      time: now(),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
      messageType: 'MESSAGE',
      myVersion: appVersion,
      ...message,
    })
  )
  if (!Either.isRight(serialized))
    throw new Error(`Failed to serialize message: ${serialized.left._tag}`)

  const parsed = parseChatMessage({
    appVersion,
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('image-message-cypher'),
      senderPublicKey: senderKeyPair.publicKeyPemBase64,
    }),
  })(serialized.right)
  if (!E.isRight(parsed))
    throw new Error(`Failed to parse message: ${parsed.left._tag}`)

  return parsed.right
}

it('preserves the image attachment and the replied-to image attachment', () => {
  const parsed = roundTrip({
    imageAttachment,
    repliedTo: {text: 'hi', messageAuthor: 'them', imageAttachment},
  })

  expect(parsed.imageAttachment).toEqual(imageAttachment)
  expect(parsed.repliedTo?.imageAttachment).toEqual(imageAttachment)
})

it('never sends the local image uri of a chat message', () => {
  const parsed = roundTrip({
    image: Schema.decodeSync(UriString)('file:///image.jpg'),
  })

  expect(parsed.image).toBeUndefined()
})

it('keeps the revealed identity photo', () => {
  const parsed = roundTrip({
    messageType: 'APPROVE_REVEAL',
    image: Schema.decodeSync(UriString)('data:image/jpeg;base64,aW1hZ2U='),
    deanonymizedUser: {name: 'Dave'},
  })

  expect(parsed.image).toBe('data:image/jpg;base64,aW1hZ2U=')
})
