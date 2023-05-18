import {
  PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {getPrivateApi} from '../api'
import {pipe} from 'fp-ts/function'
import {
  parseJson,
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import sendMessage from '@vexl-next/resources-utils/dist/chat/sendMessage'
import {now} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {parseCredentialsJson} from '../utils/auth'
import {generateChatMessageId} from '@vexl-next/domain/dist/general/messaging'

export default function sendTextMessage({
  userCredentialsJson,
  inboxKeyPairJson,
  toPublicKey,
  message,
}: {
  userCredentialsJson: string
  toPublicKey: PublicKeyPemBase64
  inboxKeyPairJson: string
  message: string
}) {
  return pipe(
    TE.Do,
    TE.bindW('credentials', () =>
      TE.fromEither(parseCredentialsJson(userCredentialsJson))
    ),
    TE.bindW('inboxKeyPair', () =>
      pipe(
        inboxKeyPairJson,
        parseJson,
        E.chainW(safeParse(PrivateKeyHolder)),
        TE.fromEither
      )
    ),
    TE.bindW('api', ({credentials}) => TE.right(getPrivateApi(credentials))),
    TE.chainW(({api, inboxKeyPair, credentials}) =>
      sendMessage({
        message: {
          text: message,
          messageType: 'MESSAGE',
          time: now(),
          senderPublicKey: inboxKeyPair.publicKeyPemBase64,
          uuid: generateChatMessageId(),
        },
        api: api.chat,
        senderKeypair: inboxKeyPair,
        receiverPublicKey: toPublicKey,
      })
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
