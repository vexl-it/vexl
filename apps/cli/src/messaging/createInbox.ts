import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import {getPrivateApiFromCredentialsFile} from '../api'
import * as TE from 'fp-ts/TaskEither'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import generateSignedChallenge from './utils/generateSignedChallenge'
import {type CreateInboxRequest} from '@vexl-next/rest-api/dist/services/chat/contracts'
import {parseAuthFile} from '../utils/auth'
import {saveInboxToFile} from './utils/SavedInbox'

export default async function createInbox({
  notificationToken,
  credentialsFile,
  keypair,
  outFile,
}: {
  keypair: PrivateKeyHolder
  notificationToken?: string
  credentialsFile: PathString
  outFile: PathString
}) {
  await pipe(
    getPrivateApiFromCredentialsFile(credentialsFile),
    TE.fromEither,
    TE.chainW((api) =>
      pipe(
        generateSignedChallenge({keypair, chatApi: api.chat}),
        TE.map(
          (challenge) =>
            ({
              publicKey: keypair.publicKeyPemBase64,
              signedChallenge: challenge,
              token: notificationToken,
            } as CreateInboxRequest)
        ),
        TE.chainW(api.chat.createInbox)
      )
    ),
    TE.chainEitherKW(() => parseAuthFile(credentialsFile)),
    TE.chainEitherKW((credentials) =>
      saveInboxToFile(outFile)({
        keypair,
        ownerCredentials: credentials,
        chats: [],
      })
    ),
    TE.match(
      (e) => {
        console.error('Error saving credentials file', e)
      },
      () => {
        console.log(`Inbox created successfully. Saved to file ${outFile}`)
      }
    )
  )()
}
