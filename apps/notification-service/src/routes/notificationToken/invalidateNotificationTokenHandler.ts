import {HttpApiBuilder} from '@effect/platform/index'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

export const invalidateNotificationTokenHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'invalidateNotificationToken',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const {payload} = req

        const db = yield* NotificationTokensDb

        yield* db.deleteNotificationToken(payload.tokenToInvalidate)
      })
    )
)
