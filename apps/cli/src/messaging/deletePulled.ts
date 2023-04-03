import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {readInboxFromFile} from './utils/SavedInbox'
import {pipe} from 'fp-ts/function'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import generateSignedChallenge from './utils/generateSignedChallenge'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'

function deletePulledMessages({
  api,
  keypair,
}: {
  api: ChatPrivateApi
  keypair: PrivateKeyHolder
}) {
  return pipe(
    generateSignedChallenge({keypair, chatApi: api}),
    TE.chainW((challenge) =>
      api.deletePulledMessages({
        publicKey: keypair.publicKeyPemBase64,
        signedChallenge: challenge,
      })
    )
  )
}

export async function deletePulled({inboxFile}: {inboxFile: PathString}) {
  await pipe(
    readInboxFromFile(inboxFile),
    TE.fromEither,
    TE.bindW('api', ({ownerCredentials}) =>
      TE.right(getPrivateApi(ownerCredentials))
    ),
    TE.chainW(({api, keypair}) =>
      deletePulledMessages({keypair, api: api.chat})
    ),
    TE.match(
      (e) => {
        console.error(`error while deleting pulled messages`)
      },
      () => {
        console.log('Deleted pulled messages successfully')
      }
    )
  )()
}
