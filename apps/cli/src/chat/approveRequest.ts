import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'
import {
  PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import {parseCredentialsJson} from '../utils/auth'
import {
  parseJson,
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import confirmMessagingRequest from '@vexl-next/resources-utils/dist/chat/confirmMessagingRequest'
import * as E from 'fp-ts/Either'

export default function approveRequest({
  userCredentialsJson,
  toPublicKey,
  message,
  approve,
  inboxKeyPairJson,
}: {
  userCredentialsJson: string
  toPublicKey: PublicKeyPemBase64
  message: string
  approve: boolean
  inboxKeyPairJson: string
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
    TE.chainW(({api, inboxKeyPair}) =>
      confirmMessagingRequest({
        text: message,
        api: api.chat,
        approve,
        toPublicKey,
        fromKeypair: inboxKeyPair,
      })
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
