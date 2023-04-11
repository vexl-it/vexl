import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {parseCredentialsJson} from '../utils/auth'
import {
  parseJson,
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import retrieveMessages from '@vexl-next/resources-utils/dist/chat/retrieveMessages'
import * as E from 'fp-ts/Either'
import {getPrivateApi} from '../api'

export default function pullMessages({
  inboxKeyPairJson,
  userCredentialsJson,
}: {
  inboxKeyPairJson: string
  userCredentialsJson: string
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
      retrieveMessages({api: api.chat, inboxKeypair: inboxKeyPair})
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
