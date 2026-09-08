import {Array, Layer, Option, Schema} from 'effect'
import {RpcMessage, RpcSerialization} from 'effect/unstable/rpc'

type LegacyFiberId =
  | {readonly _tag: 'None'}
  | {
      readonly _tag: 'Runtime'
      readonly id: number
      readonly startTimeMillis: number
    }
  | {
      readonly _tag: 'Composite'
      readonly left: LegacyFiberId
      readonly right: LegacyFiberId
    }

const LegacyFiberId: Schema.Codec<LegacyFiberId> = Schema.suspend(() =>
  Schema.Union([
    Schema.Struct({_tag: Schema.Literal('None')}),
    Schema.Struct({
      _tag: Schema.Literal('Runtime'),
      id: Schema.Number,
      startTimeMillis: Schema.Number,
    }),
    Schema.Struct({
      _tag: Schema.Literal('Composite'),
      left: LegacyFiberId,
      right: LegacyFiberId,
    }),
  ])
)

function fiberIds(fiber: LegacyFiberId): ReadonlyArray<number | null> {
  switch (fiber._tag) {
    case 'None':
      return [null]
    case 'Runtime':
      return [fiber.id]
    case 'Composite':
      return [...fiberIds(fiber.left), ...fiberIds(fiber.right)]
  }
}

type LegacyCause =
  | {readonly _tag: 'Empty'}
  | {readonly _tag: 'Fail'; readonly error: unknown}
  | {readonly _tag: 'Die'; readonly defect: unknown}
  | {readonly _tag: 'Interrupt'; readonly fiberId: LegacyFiberId}
  | {
      readonly _tag: 'Sequential' | 'Parallel'
      readonly left: LegacyCause
      readonly right: LegacyCause
    }

const LegacyCause: Schema.Codec<LegacyCause> = Schema.suspend(() =>
  Schema.Union([
    Schema.Struct({_tag: Schema.Literal('Empty')}),
    Schema.Struct({_tag: Schema.Literal('Fail'), error: Schema.Unknown}),
    Schema.Struct({_tag: Schema.Literal('Die'), defect: Schema.Unknown}),
    Schema.Struct({_tag: Schema.Literal('Interrupt'), fiberId: LegacyFiberId}),
    Schema.Struct({
      _tag: Schema.Literals(['Sequential', 'Parallel']),
      left: LegacyCause,
      right: LegacyCause,
    }),
  ])
)

const Reason = Schema.Union([
  Schema.Struct({_tag: Schema.Literal('Fail'), error: Schema.Unknown}),
  Schema.Struct({_tag: Schema.Literal('Die'), defect: Schema.Unknown}),
  Schema.Struct({
    _tag: Schema.Literal('Interrupt'),
    fiberId: Schema.NullOr(Schema.Number),
  }),
])
type Reason = typeof Reason.Type

const ExitMessage = Schema.Struct({
  _tag: Schema.Literal('Exit'),
  requestId: Schema.Union([Schema.String, Schema.Number]),
  exit: Schema.Union([
    Schema.Struct({
      _tag: Schema.Literal('Success'),
      value: Schema.optional(Schema.Unknown),
    }),
    Schema.Struct({_tag: Schema.Literal('Failure'), cause: Schema.Unknown}),
  ]),
})

function flattenCause(cause: LegacyCause): readonly Reason[] {
  switch (cause._tag) {
    case 'Empty':
      return []
    case 'Sequential':
    case 'Parallel':
      return [...flattenCause(cause.left), ...flattenCause(cause.right)]
    case 'Interrupt':
      return Array.map(
        fiberIds(cause.fiberId),
        (fiberId): Reason => ({_tag: 'Interrupt', fiberId})
      )
    default:
      return [cause]
  }
}

function legacyReason(reason: Reason): LegacyCause {
  if (reason._tag !== 'Interrupt') return reason
  return {
    _tag: 'Interrupt',
    fiberId:
      reason.fiberId === null
        ? {_tag: 'None'}
        : {_tag: 'Runtime', id: reason.fiberId, startTimeMillis: 0},
  }
}

function decodeMessage(message: unknown): unknown {
  const decoded = Schema.decodeUnknownOption(ExitMessage)(message)
  if (Option.isNone(decoded)) return message
  const value = decoded.value
  if (value.exit._tag === 'Success') {
    return {...value, exit: {...value.exit, value: value.exit.value ?? null}}
  }
  const cause = Schema.decodeUnknownOption(LegacyCause)(value.exit.cause)
  return Option.isNone(cause)
    ? message
    : {
        ...value,
        exit: {_tag: 'Failure', cause: flattenCause(cause.value)},
      }
}

function encodeMessage(message: unknown): unknown {
  if (Array.isArray(message)) return Array.map(message, encodeMessage)
  const decoded = Schema.decodeUnknownOption(ExitMessage)(message)
  if (Option.isNone(decoded)) return message
  const value = decoded.value
  if (value.exit._tag === 'Success') {
    return message
  }
  const reasons = Schema.decodeUnknownOption(Schema.Array(Reason))(
    value.exit.cause
  )
  if (Option.isNone(reasons)) return message
  const cause = Array.reduce(
    reasons.value,
    {_tag: 'Empty'} satisfies LegacyCause,
    (left: LegacyCause, reason): LegacyCause =>
      left._tag === 'Empty'
        ? legacyReason(reason)
        : {_tag: 'Sequential', left, right: legacyReason(reason)}
  )
  return {...value, exit: {_tag: 'Failure', cause}}
}

// Keep the deployed v3 wire format while mobile and backend upgrade independently.
export const notificationRpcSerialization: RpcSerialization.RpcSerialization['Service'] =
  {
    ...RpcSerialization.ndjson,
    makeUnsafe: () => {
      const parser = RpcSerialization.ndjson.makeUnsafe()
      return {
        decode: (data) => Array.map(parser.decode(data), decodeMessage),
        encode: (message) => parser.encode(encodeMessage(message)),
      }
    },
  }

export const notificationRpcSerializationLayer = Layer.succeed(
  RpcSerialization.RpcSerialization,
  notificationRpcSerialization
)

let requestId = 0n
export const generateNotificationRequestId = (): RpcMessage.RequestId =>
  RpcMessage.RequestId(String(++requestId))
