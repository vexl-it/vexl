import {HttpRouter, HttpServerResponse} from '@effect/platform'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {Effect} from 'effect'
import {processNewContentNotifications} from './routes/processNewContentNotifications'
import {processUserInactivity} from './routes/processUserInactivity'
import {sendCreateOfferPromptToGeneralTopic} from './routes/sendCreateOfferPromptToGeneralTopic'

export const internalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post(
      '/process-user-inactivity',
      processUserInactivity.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error.message, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/process-new-content-notification',
      processNewContentNotifications.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error.message, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    ),
    HttpRouter.post(
      '/send-create-offer-prompt-to-general-topic',
      sendCreateOfferPromptToGeneralTopic.pipe(
        Effect.mapBoth({
          onFailure: (error) =>
            HttpServerResponse.text(error.message, {status: 500}),
          onSuccess: () => HttpServerResponse.text('ok', {status: 200}),
        })
      )
    )
  ),
  {port: internalServerPortConfig}
)