import {Effect, Option, Schema} from 'effect'
import {HttpServerRequest} from 'effect/unstable/http'

const ConnectingIp = Schema.String.pipe(Schema.brand('ConnectingIp'))
export type ConnectingIp = typeof ConnectingIp.Type

export const getConnectingIp: Effect.Effect<
  Option.Option<ConnectingIp>,
  never,
  HttpServerRequest.HttpServerRequest
> = HttpServerRequest.schemaHeaders(
  Schema.Struct({
    'cf-connecting-ip': Schema.OptionFromOptional(ConnectingIp).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
  })
).pipe(
  Effect.map((headers) => headers['cf-connecting-ip']),
  Effect.catch((e) => Effect.succeed(Option.none()))
)
