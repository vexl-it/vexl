import {HttpRouter, HttpServerResponse} from '@effect/platform'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {Effect} from 'effect'

const processUserInactivity = Effect.gen(function* (_) {
  return HttpServerResponse.text('ok', {status: 200})
})

const processNewContentNotification = Effect.gen(function* (_) {
  return HttpServerResponse.text('ok', {status: 200})
})

const sendCreateOfferPromptToGeneralTopic = Effect.gen(function* (_) {
  return HttpServerResponse.text('ok', {status: 200})
})

export const InternalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post('/process-user-inactivity', processUserInactivity),
    HttpRouter.post(
      '/process-new-content-notification',
      processNewContentNotification
    ),
    HttpRouter.post(
      '/send-create-offer-prompt-to-general-topic',
      sendCreateOfferPromptToGeneralTopic
    )
  ),
  {port: internalServerPortConfig}
)
