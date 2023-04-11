import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'
import {parseCredentialsJson} from '../utils/auth'
import {stringifyToPrettyJson} from '@vexl-next/resources-utils/dist/utils/parsing'
import {sendMessagingRequest} from '@vexl-next/resources-utils/dist/chat/sendMessagingRequest'

export default function requestMessaging({
  userCredentialsJson,
  toPublicKey,
  message,
}: {
  userCredentialsJson: string
  toPublicKey: PublicKeyPemBase64
  message: string
}) {
  return pipe(
    TE.Do,
    TE.bindW('userCredentials', () =>
      TE.fromEither(parseCredentialsJson(userCredentialsJson))
    ),
    TE.bindW('api', ({userCredentials}) =>
      TE.right(getPrivateApi(userCredentials))
    ),
    TE.chainW(({api, userCredentials}) =>
      sendMessagingRequest({
        text: message,
        api: api.chat,
        toPublicKey,
        fromKeypair: userCredentials.keypair,
      })
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
