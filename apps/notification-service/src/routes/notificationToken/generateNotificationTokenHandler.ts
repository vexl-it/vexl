import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  VEXL_TOKEN_PREFIX,
  VexlNotificationToken,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Schema} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

const generateVexlNotificationToken = (): Effect.Effect<
  VexlNotificationToken,
  UnexpectedServerError,
  never
> =>
  Schema.decodeEffect(VexlNotificationToken)(
    `${VEXL_TOKEN_PREFIX}${generateUuid()}`
  ).pipe(
    Effect.catch(() =>
      Effect.fail(
        new UnexpectedServerError({
          status: 500,
          cause: 'Failed to create notification token',
        })
      )
    )
  )

export const generateNotificationTokenHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'generateNotificationToken',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const {payload} = req

        const db = yield* NotificationTokensDb

        const secretRecordOption = yield* db.findSecretBySecretValue(
          payload.secret
        )

        const secretRecord = yield* Effect.fromOption(
          secretRecordOption,
          () => new NotFoundError({status: 404})
        )

        const token = yield* generateVexlNotificationToken()

        yield* db.saveNotificationToken({
          token,
          secretId: secretRecord.id,
        })

        return {token}
      })
    )
)
