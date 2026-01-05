import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {MissingCommonHeadersError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

const generateSecret = (): Effect.Effect<
  VexlNotificationTokenSecret,
  UnexpectedServerError
> =>
  Schema.decode(VexlNotificationTokenSecret)(generateUuid()).pipe(
    Effect.catchAll(() =>
      Effect.fail(
        new UnexpectedServerError({
          status: 500,
          cause: 'Failed to decode secret',
        })
      )
    )
  )

export const createNotificationSecretHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'CreateNotificationSecret',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {payload, headers} = req

        const {clientPlatform, clientVersion, clientAppSource, clientLanguage} =
          yield* _(
            Option.all({
              clientPlatform: headers.clientPlatformOrNone,
              clientVersion: headers.clientVersionOrNone,
              clientAppSource: headers.appSourceOrNone,
              clientLanguage: headers.language,
            }),
            Effect.mapError(() => new MissingCommonHeadersError())
          )

        const db = yield* NotificationTokensDb

        const secret = yield* _(generateSecret())

        const now = new Date()
        yield* db.saveNotificationTokenSecret({
          secret,
          expoNotificationToken: payload.expoNotificationToken,
          clientPlatform,
          clientVersion,
          clientAppSource,
          clientLanguage,
          createdAt: now,
          updatedAt: now,
        })

        return {secret}
      })
    )
)
