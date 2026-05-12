import {HttpApiBuilder} from '@effect/platform/index'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
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
        const secretForToken = yield* db.findSecretByNotificationToken(
          payload.tokenToInvalidate
        )

        if (
          Option.isSome(secretForToken) &&
          secretForToken.value.secret === payload.secret
        ) {
          yield* db.deleteNotificationToken(payload.tokenToInvalidate)
        }
      })
    )
)
