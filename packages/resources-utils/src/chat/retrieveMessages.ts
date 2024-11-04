import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {Array, Effect, Either, pipe} from 'effect'
import {flow} from 'fp-ts/function'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {type ErrorDecryptingMessage} from './utils/chatCrypto'
import {messageFromNetwork} from './utils/messageIO'
import {
  type ErrorChatMessageRequiresNewerVersion,
  type ErrorParsingChatMessage,
} from './utils/parseChatMessage'

export type ApiErrorRetrievingMessages = Effect.Effect.Error<
  ReturnType<ChatApi['retrieveMessages']>
>

export default function retrieveMessages({
  api,
  inboxKeypair,
  currentAppVersion,
}: {
  api: ChatApi
  inboxKeypair: PrivateKeyHolder
  currentAppVersion: SemverString
}): Effect.Effect<
  {
    errors: Array<
      | ErrorDecryptingMessage
      | ErrorParsingChatMessage
      | ErrorChatMessageRequiresNewerVersion
    >
    messages: ChatMessage[]
  },
  ApiErrorRetrievingMessages
> {
  return api.retrieveMessages({keyPair: inboxKeypair}).pipe(
    Effect.map((r) => r.messages),
    Effect.flatMap(
      flow(
        Array.map((message) =>
          taskEitherToEffect(
            messageFromNetwork({
              privateKey: inboxKeypair,
              appVersion: currentAppVersion,
            })(message)
          )
        ),
        Array.map(Effect.either),
        Effect.all,
        Effect.map((eithers) => ({
          errors: pipe(Array.filterMap(eithers, Either.getLeft)),
          messages: pipe(Array.filterMap(eithers, Either.getRight)),
        }))
      )
    )
  )
}
