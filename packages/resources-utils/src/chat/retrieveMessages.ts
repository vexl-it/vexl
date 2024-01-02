import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import {type SemverString} from '@vexl-next/domain/dist/utility/SmeverString.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'
import {type ErrorDecryptingMessage} from './utils/chatCrypto'
import {messageFromNetwork} from './utils/messageIO'
import {
  type ErrorChatMessageRequiresNewerVersion,
  type ErrorParsingChatMessage,
} from './utils/parseChatMessage'

export type ApiErrorRetrievingMessages = ExtractLeftTE<
  ReturnType<ChatPrivateApi['retrieveMessages']>
>
export default function retrieveMessages({
  api,
  inboxKeypair,
  currentAppVersion,
}: {
  api: ChatPrivateApi
  inboxKeypair: PrivateKeyHolder
  currentAppVersion: SemverString
}): TE.TaskEither<
  ApiErrorRetrievingMessages,
  {
    errors: Array<
      | ErrorDecryptingMessage
      | ErrorParsingChatMessage
      | ErrorChatMessageRequiresNewerVersion
    >
    messages: ChatMessage[]
  }
> {
  return pipe(
    api.retrieveMessages({keyPair: inboxKeypair}),
    TE.map((r) => r.messages),
    TE.chainTaskK(
      flow(
        A.map(
          messageFromNetwork({
            privateKey: inboxKeypair,
            appVersion: currentAppVersion,
          })
        ),
        A.sequence(T.ApplicativePar),
        flattenTaskOfEithers,
        T.map(({lefts, rights}) => ({errors: lefts, messages: rights}))
      )
    )
  )
}
