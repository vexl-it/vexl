import {HttpApiBuilder} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {NotificationTokensDb} from '../services/NotificationTokensDb'

const generateVexlNotificationToken = Schema.decode(VexlNotificationToken)(
  generateUuid()
).pipe(
  Effect.catchAll(() =>
    Effect.fail(
      new UnexpectedServerError({
        status: 500,
        cause: 'Failed to create notification token',
      })
    )
  )
)

export const generateNotificationTokenHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'generateNotificationToken',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {payload} = req

        const db = yield* NotificationTokensDb

        const secretRecordOption = yield* db.findSecretBySecretValue(
          payload.secret
        )

        const secretRecord = yield* secretRecordOption.pipe(
          Effect.catchAll(() => Effect.fail(new NotFoundError({status: 404})))
        )

        const token = yield* _(generateVexlNotificationToken)

        yield* db.saveNotificationToken({
          token,
          secretId: secretRecord.id,
        })

        return {token}
      })
    )
)
