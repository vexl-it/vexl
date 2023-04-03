import * as TE from 'fp-ts/TaskEither'
import {readInboxFromFile} from './utils/SavedInbox'
import {getPrivateApi} from '../api'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {flow, pipe} from 'fp-ts/function'
import {
  type ChatMessage,
  MessageTypes,
} from '@vexl-next/domain/dist/general/messaging'
import {randomUUID} from 'node:crypto'
import {Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {encryptMessage} from './utils/messageCrypto'
import generateSignedChallenge from './utils/generateSignedChallenge'

function createApproveChatMessage({
  text,
  senderPublicKey,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
}): ChatMessage {
  return {
    uuid: Uuid.parse(randomUUID()),
    messageType: MessageTypes.APPROVE_MESSAGING,
    text,
    isMine: true,
    time: now(),
    senderPublicKey,
    sent: false,
  }
}

export function sendMessagingResponse({
  text,
  fromKeypair,
  toPublicKey,
  approve,
  api,
}: {
  text: string
  approve: boolean
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatPrivateApi
}) {
  return pipe(
    createApproveChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    }),
    TE.right,
    TE.bindTo('message'),
    TE.bindW('encryptedMessage', ({message}) =>
      encryptMessage(toPublicKey)(message)
    ),
    TE.bindW('response', ({encryptedMessage}) =>
      api.approveRequest({
        message: encryptedMessage,
        publicKeyToConfirm: toPublicKey,
        approve,
        keyPair: fromKeypair,
      })
    ),
    TE.map(({message}) => ({...message, sent: true}))
  )
}

export async function approveConfirm({
  inboxFile,
  toPublicKey,
  text,
  approve,
}: {
  inboxFile: PathString
  toPublicKey: PublicKeyPemBase64
  text: string
  approve: boolean
}) {
  await pipe(
    readInboxFromFile(inboxFile),
    TE.fromEither,
    TE.bindW('api', ({ownerCredentials}) =>
      TE.right(getPrivateApi(ownerCredentials))
    ),
    TE.chainW(({api, ownerCredentials, keypair}) =>
      sendMessagingResponse({
        text,
        api: api.chat,
        approve,
        toPublicKey,
        fromKeypair: keypair,
      })
    )
  )()
}
