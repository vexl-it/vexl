import {HttpApiBuilder} from '@effect/platform/index'
import {MissingCommonHeadersError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

export const updateNotificationInfoHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'updateNoficationInfo',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {payload, headers} = req

        const {clientPlatform, clientVersion, clientAppSource, language} =
          yield* _(
            Option.all({
              clientPlatform: headers.clientPlatformOrNone,
              clientVersion: headers.clientVersionOrNone,
              clientAppSource: headers.appSourceOrNone,
              language: headers.language,
            }),
            Effect.mapError(() => new MissingCommonHeadersError())
          )

        const clientPrefix = Option.getOrNull(headers.prefixOrNone)

        const db = yield* NotificationTokensDb

        yield* db.updateClientInfo({
          secretToken: payload.secret,
          expoNotificationToken: payload.expoNotificationToken ?? null,
          clientLanguage: language,
          clientPlatform,
          clientVersion,
          clientAppSource,
          clientPrefix,
        })
      })
    )
)
