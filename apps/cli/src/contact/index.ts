import {parseCredentialsJson, UserCredentials} from '../utils/auth'
import {pipe} from 'fp-ts/function'
import {getPrivateApi} from '../api'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {parseJson, safeParse, stringifyToPrettyJson} from '@vexl-next/resources-utils/dist/utils/parsing'
import {hmacSign} from '@vexl-next/resources-utils/dist/utils/crypto'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/dist/Pagination.brand'

// import {CombineErrors} from '@vexl-next/resources-utils/src/utils/fpTypeUtils'

export function importContacts({
  contactsList,
  credentialsJson,
}: {
  contactsList: string
  credentialsJson: string
}): TE.TaskEither<unknown, string> {
  return pipe(
    parseJson(credentialsJson),
    E.map(getPrivateApi),
    E.bindTo('api'),
    E.bindW('contactsHashed', () =>
      pipe(
        contactsList.split(/[,\n]/),
        A.map(hmacSign('VexlVexl')),
        A.sequence(E.Applicative)
      )
    ),
    TE.fromEither,
    TE.chainW(({api, contactsHashed}) =>
      api.contact.importContacts({contacts: contactsHashed})
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}

export function getContacts({
  connectionLevel,
  credentialsJson,
}: {
  connectionLevel: ConnectionLevel
  credentialsJson: string
}): TE.TaskEither<unknown, string> {
  return pipe(
    parseCredentialsJson(credentialsJson),
    E.map(getPrivateApi),
    E.bindTo('api'),
    TE.fromEither,
    TE.chainW(({api}) =>
      api.contact.fetchMyContacts({
        level: connectionLevel,
        limit: MAX_PAGE_SIZE,
        page: 0,
      })
    ),
    TE.map((r) => r.items),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}

const parsePublicKey = safeParse(PublicKeyPemBase64)

export function getCommonConnections({
  credentialsJson,
  publicKeysListString,
}: {
  credentialsJson: string
  publicKeysListString: string
}) {
  return pipe(
    E.right({}),
    E.bindW('api', () =>
      pipe(
        credentialsJson,
        parseJson,
        E.chainW(safeParse(UserCredentials)),
        E.map(getPrivateApi)
      )
    ),
    E.bindW('publicKeys', () =>
      pipe(
        pipe(
          publicKeysListString.split(/[,\n]/),
          A.map(parsePublicKey),
          A.sequence(E.Applicative)
        )
      )
    ),
    TE.fromEither,
    TE.chainW(({api, publicKeys}) =>
      api.contact.fetchCommonConnections({
        publicKeys,
      })
    ),
    TE.map((r) => r.commonContacts),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
