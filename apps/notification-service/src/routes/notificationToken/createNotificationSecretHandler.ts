import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  VEXL_NOTIFICATION_TOKEN_SECRET_PREFIX,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {MissingCommonHeadersError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option, pipe, Schema} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

const generateSecret = (): Effect.Effect<
  VexlNotificationTokenSecret,
  UnexpectedServerError
> =>
  Schema.decodeEffect(VexlNotificationTokenSecret)(
    `${VEXL_NOTIFICATION_TOKEN_SECRET_PREFIX}${generateUuid()}`
  ).pipe(
    Effect.catch(() =>
      Effect.fail(
        new UnexpectedServerError({
          status: 500,
          cause: 'Failed to decode secret',
        })
      )
    )
  )

export const createNotificationSecretHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'CreateNotificationSecret',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const {payload, headers} = req

        const {clientPlatform, clientVersion, clientAppSource, clientLanguage} =
          yield* pipe(
            Effect.fromOption(
              Option.all({
                clientPlatform: headers.clientPlatformOrNone,
                clientVersion: headers.clientVersionOrNone,
                clientAppSource: headers.appSourceOrNone,
                clientLanguage: headers.language,
              })
            ),
            Effect.mapError(() => new MissingCommonHeadersError())
          )

        const clientPrefix = Option.getOrNull(headers.prefixOrNone)

        const db = yield* NotificationTokensDb

        const secret = yield* generateSecret()

        const now = new Date()
        yield* db.saveNotificationTokenSecret({
          secret,
          expoNotificationToken: payload.expoNotificationToken ?? null,
          clientPlatform,
          clientVersion,
          clientAppSource,
          clientLanguage,
          clientPrefix,
          createdAt: now,
          updatedAt: now,
        })

        return {secret}
      })
    )
)
