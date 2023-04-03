import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import {addMessageToChat, readInboxFromFile} from './utils/SavedInbox'
import {getPrivateApi} from '../api'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import generateSignedChallenge from './utils/generateSignedChallenge'
import {decryptMessage} from './utils/messageCrypto'

function pullMessagesFromApi({
  api,
  inboxKeypair,
}: {
  api: ChatPrivateApi
  inboxKeypair: PrivateKeyHolder
}) {
  return pipe(
    generateSignedChallenge({keypair: inboxKeypair, chatApi: api}),
    TE.chainW((challenge) =>
      api.retrieveMessages({
        publicKey: inboxKeypair.publicKeyPemBase64,
        signedChallenge: challenge,
      })
    ),
    TE.map((r) => r.messages),
    TE.chainW(
      flow(A.map(decryptMessage(inboxKeypair)), A.sequence(TE.ApplicativePar))
    )
  )
}

export default async function pullMessages({
  inboxFile,
}: {
  inboxFile: PathString
}) {
  await pipe(
    readInboxFromFile(inboxFile),
    TE.fromEither,
    TE.bindW('api', ({ownerCredentials}) =>
      TE.right(getPrivateApi(ownerCredentials))
    ),
    TE.chainW(({keypair, api}) =>
      pullMessagesFromApi({inboxKeypair: keypair, api: api.chat})
    ),
    TE.chainW(
      flow(
        A.map((message) =>
          addMessageToChat({
            inboxFile,
            otherSidePublicKey: message.senderPublicKey,
          })(message)
        ),
        A.sequence(E.Applicative),
        TE.fromEither
      )
    ),
    TE.match(
      (e) => {
        console.log('Error pulling messages', e)
      },
      () => {
        console.log(
          `Messages pulled successfully. Saved into file ${inboxFile}`
        )
      }
    )
  )()
}
