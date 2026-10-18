import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatMessage,
  MessageCypher,
  ServerMessage,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Either, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {
  chatHistoryToMessages,
  createHistoryMessage,
  createRequestHistoryMessage,
  type ChatMessageWithDirection,
} from './chatHistory'
import {parseChatMessage} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

const historySender = generatePrivateKey()
const historyReceiver = generatePrivateKey()
const image = Schema.decodeSync(UriString)('data:image/jpg;base64,aGVsbG8=')
const appVersion = Schema.decodeSync(VersionString)('26.10.0')

const chatMessage = (fields: Partial<ChatMessage>): ChatMessage =>
  Schema.decodeSync(ChatMessage)({
    uuid: generateChatMessageId(),
    text: 'hello',
    time: now(),
    senderPublicKey: historySender.publicKeyPemBase64,
    messageType: 'MESSAGE',
    ...fields,
  })

const sendAndReceive = (message: ChatMessage): ChatMessage => {
  const serialized = serializeChatMessage(message)
  if (!Either.isRight(serialized)) throw new Error('Failed to serialize')

  const parsed = parseChatMessage({
    appVersion,
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('cypher'),
      senderPublicKey: historySender.publicKeyPemBase64,
    }),
  })(serialized.right)
  if (!E.isRight(parsed)) throw new Error('Failed to parse')

  return parsed.right
}

it('rebuilds chat history on the other side with flipped direction and no images', () => {
  const sentByHistorySender = chatMessage({
    text: 'mine',
    image,
    repliedTo: {text: 'earlier', messageAuthor: 'them', image},
  })
  const receivedByHistorySender = chatMessage({
    text: 'theirs',
    senderPublicKey: historyReceiver.publicKeyPemBase64,
  })
  const identityReveal = chatMessage({
    messageType: 'APPROVE_REVEAL',
    text: '',
    deanonymizedUser: {name: Schema.decodeSync(UserName)('Satoshi')},
    tradeChecklistUpdate: {
      identity: {timestamp: now(), status: 'APPROVE_REVEAL', image},
    },
  })

  const messages: ChatMessageWithDirection[] = [
    {state: 'sent', message: sentByHistorySender},
    {state: 'received', message: receivedByHistorySender},
    {state: 'sent', message: identityReveal},
    {state: 'sent', message: chatMessage({text: '', image})},
    {state: 'sent', message: chatMessage({messageType: 'MESSAGE_READ'})},
  ]

  const received = sendAndReceive(
    createHistoryMessage({
      senderPublicKey: historySender.publicKeyPemBase64,
      myVersion: appVersion,
      messages,
    })
  )

  expect(received.messageType).toBe('HISTORY')
  expect(received.minimalRequiredVersion).toBe('26.10.0')

  const rebuilt = chatHistoryToMessages({
    history: received.history ?? [],
    myPublicKey: historyReceiver.publicKeyPemBase64,
    otherSidePublicKey: historySender.publicKeyPemBase64,
  })

  expect(rebuilt.map((one) => [one.state, one.message.uuid])).toEqual([
    ['received', sentByHistorySender.uuid],
    ['sent', receivedByHistorySender.uuid],
    ['received', identityReveal.uuid],
  ])
  expect(rebuilt[0]?.message).toMatchObject({
    senderPublicKey: historySender.publicKeyPemBase64,
    text: 'mine',
    repliedTo: {text: 'earlier', messageAuthor: 'them'},
  })
  expect(rebuilt[0]?.message.image).toBeUndefined()
  expect(rebuilt[0]?.message.repliedTo?.image).toBeUndefined()
  expect(rebuilt[1]?.message.senderPublicKey).toBe(
    historyReceiver.publicKeyPemBase64
  )
  expect(rebuilt[2]?.message.deanonymizedUser?.name).toBe('Satoshi')
  expect(rebuilt[2]?.message.tradeChecklistUpdate?.identity).toMatchObject({
    status: 'APPROVE_REVEAL',
  })
  expect(
    rebuilt[2]?.message.tradeChecklistUpdate?.identity?.image
  ).toBeUndefined()
})

it('shows HISTORY as requiring a newer version on older clients', () => {
  const serialized = serializeChatMessage(
    createHistoryMessage({
      senderPublicKey: historySender.publicKeyPemBase64,
      myVersion: appVersion,
      messages: [],
    })
  )
  if (!Either.isRight(serialized)) throw new Error('Failed to serialize')

  const parsed = parseChatMessage({
    appVersion: Schema.decodeSync(VersionString)('26.9.0'),
    serverMessage: Schema.decodeSync(ServerMessage)({
      message: Schema.decodeSync(MessageCypher)('cypher'),
      senderPublicKey: historySender.publicKeyPemBase64,
    }),
  })(serialized.right)

  expect(E.isLeft(parsed) && parsed.left._tag).toBe(
    'ErrorChatMessageRequiresNewerVersion'
  )
})

it('delivers the requester notification token with REQUEST_HISTORY', () => {
  const myVexlToken = Schema.decodeSync(VexlNotificationToken)(
    'vexl_nt_3J5j2mYQF3v8mS1kWq0dQgZk9t2yBcE4'
  )

  const received = sendAndReceive(
    createRequestHistoryMessage({
      senderPublicKey: historySender.publicKeyPemBase64,
      myVersion: appVersion,
      myVexlToken,
    })
  )

  expect(received.messageType).toBe('REQUEST_HISTORY')
  expect(received.myFcmCypher).toBe(myVexlToken)
})
