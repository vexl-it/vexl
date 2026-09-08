import {Cause, Effect, Exit, Schema, Stream} from 'effect'
import {Rpc, RpcClient, RpcGroup, RpcSerialization} from 'effect/unstable/rpc'
import {readFileSync} from 'node:fs'
import {
  generateNotificationRequestId,
  notificationRpcSerialization,
} from './rpcSerialization'

const fixtures = Schema.decodeUnknownSync(
  Schema.Array(
    Schema.Struct({
      name: Schema.String,
      message: Schema.Unknown,
    })
  )
)(
  JSON.parse(
    readFileSync(
      new URL(
        '../../../../../scripts/fixtures/effect-v3-rpc-exits.json',
        import.meta.url
      ),
      'utf8'
    )
  )
)

const rpc = Rpc.make('wire', {
  success: Schema.String,
  error: Schema.String,
  stream: true,
})
const codec = RpcSerialization.ndjson.codecFor(Rpc.exitSchema(rpc))
const ExitMessage = Schema.Struct({exit: Schema.Unknown})

it.each(fixtures)(
  'decodes the v3 $name stream exit and preserves it through a round trip',
  ({message}) => {
    const parser = notificationRpcSerialization.makeUnsafe()
    const decoded = Schema.decodeUnknownSync(ExitMessage)(
      parser.decode(JSON.stringify(message) + '\n')[0]
    )
    const exit = Schema.decodeUnknownSync(codec)(decoded.exit)
    const encoded = Schema.encodeSync(codec)(exit)
    const wire = parser.encode({_tag: 'Exit', requestId: '1', exit: encoded})
    if (wire === undefined) throw new Error('Missing encoded RPC frame')
    const roundTrip = Schema.decodeUnknownSync(ExitMessage)(
      parser.decode(wire)[0]
    )
    expect(roundTrip.exit).toEqual(encoded)
  }
)

it('encodes a v4 failure as a v3 cause tree', () => {
  const wire = notificationRpcSerialization.makeUnsafe().encode({
    _tag: 'Exit',
    requestId: '1',
    exit: Schema.encodeSync(codec)(
      Exit.failCause(Cause.combine(Cause.fail('first'), Cause.fail('second')))
    ),
  })
  expect(typeof wire).toBe('string')
  expect(wire).toBe(
    JSON.stringify({
      _tag: 'Exit',
      requestId: '1',
      exit: {
        _tag: 'Failure',
        cause: {
          _tag: 'Sequential',
          left: {_tag: 'Fail', error: 'first'},
          right: {_tag: 'Fail', error: 'second'},
        },
      },
    }) + '\n'
  )
})

it('retains partial NDJSON framing and leaves notification chunks unchanged', () => {
  const parser = notificationRpcSerialization.makeUnsafe()
  const chunk = {_tag: 'Chunk', requestId: '1', values: ['notification']}
  const frame = JSON.stringify(chunk) + '\n'
  expect(parser.decode(frame.slice(0, 7))).toEqual([])
  expect(parser.decode(frame.slice(7))).toEqual([chunk])
  expect(parser.encode(chunk)).toBe(frame)
})

it('generates distinct decimal string IDs accepted by v3 and v4 peers', () => {
  const first = generateNotificationRequestId()
  const second = generateNotificationRequestId()
  expect(typeof first).toBe('string')
  expect(String(first)).toMatch(/^\d+$/)
  expect(BigInt(second)).toBe(BigInt(first) + 1n)
})

it('consumes chunks and completes against a v3 peer with string response IDs', async () => {
  const group = RpcGroup.make(rpc)
  let receive: Parameters<RpcClient.Protocol['Service']['run']>[1] = () =>
    Effect.die('Protocol was not started')
  const protocol: RpcClient.Protocol['Service'] = {
    supportsAck: true,
    supportsTransferables: false,
    codecFor: notificationRpcSerialization.codecFor,
    run: (_id, callback) => {
      receive = callback
      return Effect.never
    },
    send: (_id, request) => {
      if (request._tag !== 'Request') return Effect.void
      const legacySuccess =
        JSON.stringify({
          _tag: 'Exit',
          requestId: String(request.id),
          exit: {_tag: 'Success'},
        }) + '\n'
      const terminal = Schema.decodeUnknownSync(
        Schema.Struct({
          _tag: Schema.Literal('Exit'),
          requestId: Schema.String,
          exit: Schema.Struct({
            _tag: Schema.Literal('Success'),
            value: Schema.Null,
          }),
        })
      )(notificationRpcSerialization.makeUnsafe().decode(legacySuccess)[0])
      return receive({
        _tag: 'Chunk',
        requestId: String(request.id),
        values: ['legacy notification'],
      }).pipe(Effect.andThen(receive(terminal)))
    },
  }
  const messages = await Effect.runPromise(
    Effect.gen(function* () {
      const client = yield* RpcClient.make(group, {
        generateRequestId: generateNotificationRequestId,
      })
      return yield* client.wire().pipe(Stream.runCollect)
    }).pipe(
      Effect.scoped,
      Effect.timeout('2 seconds'),
      Effect.provideService(RpcClient.Protocol, protocol)
    )
  )
  expect(messages).toEqual(['legacy notification'])
})

it('encodes interruption without a fiber ID for a v3 peer', () => {
  const wire = notificationRpcSerialization.makeUnsafe().encode({
    _tag: 'Exit',
    requestId: '1',
    exit: Schema.encodeSync(codec)(Exit.interrupt()),
  })
  expect(wire).toBe(
    JSON.stringify({
      _tag: 'Exit',
      requestId: '1',
      exit: {
        _tag: 'Failure',
        cause: {_tag: 'Interrupt', fiberId: {_tag: 'None'}},
      },
    }) + '\n'
  )
})
