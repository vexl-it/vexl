import {parseAuthFile} from '../utils/auth'
import {flow, pipe} from 'fp-ts/function'
import {getPrivateApi} from '../api'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {readFile} from '../utils/fs'
import {hmac} from '@vexl-next/cryptography'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

function parseFile(filePath: PathString) {
  return pipe(
    readFile(filePath),
    E.map((string) => string.split('\n').filter(Boolean)),
    E.chainW(
      flow(
        A.map((one) => hmac.hmacSign({password: 'VexlVexl', data: one})),
        E.right
      )
    )
  )
}
export async function importContacts({
  contactsPath,
  credentialsPath,
}: {
  contactsPath: PathString
  credentialsPath: PathString
}) {
  await pipe(
    parseAuthFile(credentialsPath),
    E.map(getPrivateApi),
    E.bindTo('api'),
    E.bindW('request', () =>
      pipe(
        parseFile(contactsPath),
        E.map((contacts) => ({contacts}))
      )
    ),
    TE.fromEither,
    TE.chainW(({api, request}) => api.contact.importContacts(request)),
    TE.match(
      (e) => {
        console.error('Error while importing contacts', e)
      },
      () => {
        console.log('Contacts imported')
      }
    )
  )()
}

export async function getContacts({
  credentialsPath,
  connectionLevel,
}: {
  credentialsPath: PathString
  connectionLevel: ConnectionLevel
}) {
  await pipe(
    parseAuthFile(credentialsPath),
    E.map(getPrivateApi),
    E.bindTo('api'),
    TE.fromEither,
    TE.chainW(({api}) =>
      api.contact.fetchMyContacts({
        level: connectionLevel,
        limit: 999999999,
        page: 0,
      })
    ),
    TE.match(
      (e) => {
        console.error('Error while fetching contacts', e)
      },
      (response) => {
        console.log(response.items)
      }
    )
  )()
}

export async function commonConnections({
  credentialsPath,
  publicKeys,
}: {
  credentialsPath: PathString
  publicKeys: PublicKeyPemBase64[]
}) {
  await pipe(
    parseAuthFile(credentialsPath),
    E.map(getPrivateApi),
    E.bindTo('api'),
    TE.fromEither,
    TE.chainW(({api}) =>
      api.contact.fetchCommonConnections({
        publicKeys,
      })
    ),
    TE.match(
      (e) => {
        console.error('Error while fetching common connections', e)
      },
      (response) => {
        console.log(response.commonContacts)
      }
    )
  )()
}
