import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {Effect, Schema} from 'effect'
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from 'effect/unstable/http'
import {testHasingSpeed} from './routes/testHashingSpeed'

export const internalServerLive = makeInternalServer(
  HttpRouter.add(
    'POST',
    '/test-hashing-speed',
    Effect.gen(function* () {
      const body = yield* HttpServerRequest.schemaBodyJson(
        Schema.Struct({
          iterations: Schema.Number,
          numberOfElements: Schema.Number,
        })
      )
      const durationMs = yield* testHasingSpeed(
        body.iterations,
        body.numberOfElements
      )

      return yield* HttpServerResponse.json({durationMs}, {status: 200})
    })
  ),
  {port: internalServerPortConfig}
)
