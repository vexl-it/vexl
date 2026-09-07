import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

export const invalidateNotificationSecretHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'invalidateNotificationSecret',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const {payload} = req

        const db = yield* NotificationTokensDb

        yield* db.deleteNotificationSecret(payload.secretToInvalidate)
      })
    )
)
