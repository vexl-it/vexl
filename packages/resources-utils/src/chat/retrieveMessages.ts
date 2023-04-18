import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import {decryptMessage, type ErrorDecryptingMessage} from './utils/chatCrypto'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'

export type ApiErrorRetrievingMessages =
  BasicError<'ApiErrorRetrievingMessages'>
export default function retrieveMessages({
  api,
  inboxKeypair,
}: {
  api: ChatPrivateApi
  inboxKeypair: PrivateKeyHolder
}): TE.TaskEither<
  ApiErrorRetrievingMessages,
  {errors: ErrorDecryptingMessage[]; messages: ChatMessage[]}
> {
  return pipe(
    api.retrieveMessages({keyPair: inboxKeypair}),
    TE.mapLeft(toError('ApiErrorRetrievingMessages')),
    TE.map((r) => r.messages),
    TE.chainTaskK(
      flow(
        A.map(decryptMessage(inboxKeypair)),
        A.sequence(T.ApplicativePar),
        flattenTaskOfEithers,
        T.map(({lefts, rights}) => ({errors: lefts, messages: rights}))
      )
    )
  )
}
