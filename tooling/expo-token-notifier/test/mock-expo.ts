import {Array, Schema, pipe} from 'effect'
import {appendFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {MockAgent, setGlobalDispatcher} from 'undici'
import {CliError, fail} from '../src/errors.ts'

const mock = new MockAgent()
mock.disableNetConnect()
setGlobalDispatcher(mock)
const pool = mock.get('https://exp.host')
const scenario = process.env.MOCK_EXPO_SCENARIO ?? 'success'
const log = process.env.MOCK_EXPO_LOG
let sendCalls = 0

function readBody(body: unknown): unknown {
  const buffer =
    typeof body === 'string'
      ? Buffer.from(body)
      : body instanceof Uint8Array
        ? Buffer.from(body)
        : fail('Unexpected mock request body.')
  return JSON.parse(
    (buffer[0] === 0x1f && buffer[1] === 0x8b
      ? gunzipSync(buffer)
      : buffer
    ).toString('utf8')
  )
}

function record(value: unknown): void {
  if (log) appendFileSync(log, JSON.stringify(value) + '\n')
}

const sendInterceptor = pool.intercept({
  path: '/--/api/v2/push/send',
  method: 'POST',
})
if (scenario === 'network') {
  sendInterceptor
    .replyWithError(new CliError({message: 'Synthetic connection reset'}))
    .persist()
} else {
  const scope = sendInterceptor.reply<Record<string, unknown>>(({body}) => {
    const messages = Schema.decodeUnknownSync(
      Schema.Array(Schema.Struct({to: Schema.String}))
    )(readBody(body))
    record({kind: 'send', body: readBody(body)})
    sendCalls++
    if (
      scenario === 'reject' ||
      (scenario === 'rate-limit' && sendCalls === 1)
    ) {
      return {
        statusCode: scenario === 'reject' ? 401 : 429,
        data: {
          errors: [
            {
              code: 'SYNTHETIC_FAILURE',
              message: `Synthetic rejection ${process.env.EXPO_ACCESS_TOKEN}`,
            },
          ],
        },
      }
    }
    if (scenario === 'outage' && sendCalls === 2) {
      return {
        statusCode: 503,
        data: {errors: [{code: 'UNAVAILABLE', message: 'Synthetic outage'}]},
      }
    }
    if (scenario === 'malformed')
      return {statusCode: 200, data: {data: [{status: 'unexpected'}]}}
    return {
      statusCode: 200,
      data: {
        data: pipe(
          messages,
          Array.map((message, index) =>
            scenario === 'mixed' && index === 0
              ? {
                  status: 'error',
                  message: 'Synthetic unregistered device',
                  details: {error: 'DeviceNotRegistered'},
                }
              : {status: 'ok', id: `receipt:${message.to}`}
          )
        ),
      },
    }
  })
  if (scenario === 'crash') scope.delay(60_000)
  scope.persist()
}

pool
  .intercept({path: '/--/api/v2/push/getReceipts', method: 'POST'})
  .reply<Record<string, unknown>>(({body}) => {
    const {ids} = Schema.decodeUnknownSync(
      Schema.Struct({ids: Schema.Array(Schema.String)})
    )(readBody(body))
    record({kind: 'receipts', ids})
    if (scenario === 'receipt-failure') {
      return {
        statusCode: 503,
        data: {
          errors: [{code: 'UNAVAILABLE', message: 'Synthetic receipt outage'}],
        },
      }
    }
    const data: Record<string, unknown> = {}
    for (const [index, id] of ids.entries()) {
      if (scenario === 'missing-receipts' && index > 0) continue
      data[id] =
        scenario === 'receipt-error' && index === 0
          ? {
              status: 'error',
              message: 'Synthetic credential failure',
              details: {error: 'InvalidCredentials'},
            }
          : scenario === 'malformed-receipts'
            ? {unexpected: true}
            : {status: 'ok', details: {provider: 'mock'}}
    }
    return {statusCode: 200, data: {data}}
  })
  .persist()
