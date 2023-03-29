import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {parseCredentialsJson} from '../utils/auth'
import {getPrivateApi} from '../api'
import {
  parseJson,
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import {
  generatePrivateKey,
  PrivateKeyHolder,
} from '@vexl-next/cryptography/dist/KeyHolder'

export default function createInbox({
  keypairJson,
  credentialsJson,
}: {
  keypairJson?: string
  credentialsJson: string
}) {
  return pipe(
    TE.Do,
    TE.bindW('credentials', () =>
      TE.fromEither(parseCredentialsJson(credentialsJson))
    ),
    TE.bindW('keypair', () => {
      if (keypairJson) {
        return pipe(
          parseJson(keypairJson),
          TE.fromEither,
          TE.chainEitherKW(safeParse(PrivateKeyHolder))
        )
      }
      return TE.right(generatePrivateKey())
    }),
    TE.bindW('api', ({credentials}) => TE.right(getPrivateApi(credentials))),
    TE.chainFirstW(({api, credentials, keypair}) =>
      api.chat.createInbox({keyPair: keypair})
    ),
    TE.map(({keypair, credentials}) => ({
      userCredentials: credentials,
      inboxKeyPair: keypair,
    })),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
