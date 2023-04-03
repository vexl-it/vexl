import * as TE from 'fp-ts/TaskEither'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {pipe} from 'fp-ts/function'
import {readInboxFromFile} from './utils/SavedInbox'
import {getPrivateApi} from '../api'
import generateSignedChallenge from './utils/generateSignedChallenge'
import {type DeleteInboxRequest} from '@vexl-next/rest-api/dist/services/chat/contracts'

export default async function deleteInbox({
  savedInboxFile,
}: {
  savedInboxFile: PathString
}) {
  await pipe(
    readInboxFromFile(savedInboxFile),
    TE.fromEither,
    TE.bindW('api', ({ownerCredentials}) =>
      TE.right(getPrivateApi(ownerCredentials))
    ),
    TE.chainW(({api, keypair}) =>
      pipe(
        generateSignedChallenge({keypair, chatApi: api.chat}),
        TE.chainW((challenge) =>
          api.chat.deleteInbox({
            signedChallenge: challenge,
            publicKey: keypair.publicKeyPemBase64,
          } as DeleteInboxRequest)
        )
      )
    ),
    TE.match(
      (e) => {
        console.error('Error while deleting inbox', e)
      },
      () => {
        console.log('Inbox deleted')
      }
    )
  )()
}
