import {Schema} from '@effect/schema'
import {Effect, flow, pipe} from 'effect'
import {type WebSocket} from 'ws'
import {ServerMessage} from '../../common/ServerMessage'
import {SendingMessageError, sendMessageToSocket} from './utils'

const encodeMessageForClient = pipe(
  Schema.parseJson(ServerMessage),
  Schema.encode
)

const encodeAndSendMessage =
  (socket: WebSocket) =>
  (message: ServerMessage): Effect.Effect<void, SendingMessageError, never> =>
    pipe(
      message,
      encodeMessageForClient,
      Effect.flatMap(
        flow(
          sendMessageToSocket(socket),
          Effect.tapError((e) =>
            Effect.logWarning(`Error while sending message`, {
              error: e,
              messageTag: message._tag,
            })
          ),
          Effect.retry({times: 2}),
          Effect.tapError((e) =>
            Effect.logWarning(`Error while sending message`, {
              error: e,
              messageTag: message._tag,
            })
          )
        )
      ),
      Effect.catchTag('ParseError', (e) =>
        Effect.fail(new SendingMessageError({originalError: e}))
      ),
      Effect.withSpan('encodeAndSendMessage', {attributes: {tag: message._tag}})
    )

export default encodeAndSendMessage
