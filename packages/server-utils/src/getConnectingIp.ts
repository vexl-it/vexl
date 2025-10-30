import {HttpServerRequest} from '@effect/platform'
import {Effect, Option, Schema} from 'effect/index'

const ConnectingIp = Schema.String.pipe(Schema.brand('ConnectingIp'))
export type ConnectingIp = typeof ConnectingIp.Type

export const getConnectingIp: Effect.Effect<
  Option.Option<ConnectingIp>,
  never,
  HttpServerRequest.HttpServerRequest
> = HttpServerRequest.schemaHeaders(
  Schema.Struct({
    'cf-connecting-ip': Schema.optionalWith(ConnectingIp, {as: 'Option'}),
  })
).pipe(
  Effect.map((headers) => headers['cf-connecting-ip']),
  Effect.catchAll((e) => Effect.succeed(Option.none()))
)
