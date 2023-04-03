import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {flow, pipe} from 'fp-ts/function'
import {
  addMessageToChat,
  createChat,
  readInboxFromFile,
} from './utils/SavedInbox'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'
import {
  type ChatMessage,
  MessageTypes,
} from '@vexl-next/domain/dist/general/messaging'
import {randomUUID} from 'node:crypto'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
import {encryptMessage} from './utils/messageCrypto'

function createRequestChatMessage({
  text,
  senderPublicKey,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
}): ChatMessage {
  return {
    uuid: Uuid.parse(randomUUID()),
    messageType: MessageTypes.REQUEST_MESSAGING,
    text,
    isMine: true,
    time: now(),
    senderPublicKey,
    sent: false,
  }
}

export function sendMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  api,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatPrivateApi
}): TE.TaskEither<any, ChatMessage> {
  return pipe(
    createRequestChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    }),
    TE.right,
    TE.chainFirstW(
      flow(
        encryptMessage(toPublicKey),
        TE.chainW((message) =>
          api.requestApproval({message, publicKey: toPublicKey})
        )
      )
    )
  )
}

export default async function requestMessaging({
  inboxFile,
  toPublicKey,
  text,
}: {
  inboxFile: PathString
  toPublicKey: PublicKeyPemBase64
  text: string
}) {
  await pipe(
    readInboxFromFile(inboxFile),
    TE.fromEither,
    TE.filterOrElseW(
      ({keypair, ownerCredentials}) =>
        keypair.publicKeyPemBase64 ===
        ownerCredentials.keypair.publicKeyPemBase64,
      () =>
        new Error(
          'Request can be only sent from inbox that has the same keypair as the owner credentials'
        )
    ),
    TE.bindW('api', ({ownerCredentials}) =>
      TE.right(getPrivateApi(ownerCredentials))
    ),
    TE.chainW(({keypair, api}) =>
      sendMessagingRequest({
        text,
        fromKeypair: keypair,
        toPublicKey,
        api: api.chat,
      })
    ),
    TE.chainEitherKW(
      addMessageToChat({inboxFile, otherSidePublicKey: toPublicKey})
    ),
    TE.match(
      (e) => {
        console.error('Error while sending request', e)
      },
      () => {
        console.log('Request send successfully')
      }
    )
  )()
}
