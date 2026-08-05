import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {Effect, Schema} from 'effect'
import {checkForInactiveUsers} from './routes/checkForInactiveUsers'
import {deactivateAndClearClubs} from './routes/deactivateAndClearClubs'
import {testHasingSpeed} from './routes/testHashingSpeed'

export const internalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post(
      '/deactivate-and-clear-clubs',
      deactivateAndClearClubs.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error._tag, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/delete-inactive-club-members',
      checkForInactiveUsers.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error._tag, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/test-hashing-speed',
      Effect.gen(function* (_) {
        const body = yield* _(
          HttpServerRequest.schemaBodyJson(
            Schema.Struct({
              iterations: Schema.Number,
              numberOfElements: Schema.Number,
            })
          )
        )
        const durationMs = yield* _(
          testHasingSpeed(body.iterations, body.numberOfElements)
        )

        return yield* _(HttpServerResponse.json({durationMs}, {status: 200}))
      })
    )
  ),
  {port: internalServerPortConfig}
)
