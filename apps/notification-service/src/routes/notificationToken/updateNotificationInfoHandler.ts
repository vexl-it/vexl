import {MissingCommonHeadersError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option, pipe} from 'effect'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

export const updateNotificationInfoHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'updateNoficationInfo',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const {payload, headers} = req

        const {clientPlatform, clientVersion, clientAppSource, language} =
          yield* pipe(
            Effect.fromOption(
              Option.all({
                clientPlatform: headers.clientPlatformOrNone,
                clientVersion: headers.clientVersionOrNone,
                clientAppSource: headers.appSourceOrNone,
                language: headers.language,
              })
            ),
            Effect.mapError(() => new MissingCommonHeadersError())
          )

        const clientPrefix = Option.getOrNull(headers.prefixOrNone)

        const db = yield* NotificationTokensDb

        yield* db.updateClientInfo({
          secretToken: payload.secret,
          expoNotificationToken: payload.expoNotificationToken ?? null,
          systemVexlToken: payload.systemVexlToken ?? null,
          marketingVexlToken: payload.marketingVexlToken ?? null,
          clientLanguage: language,
          clientPlatform,
          clientVersion,
          clientAppSource,
          clientPrefix,
          backgroundSocketEnabled: payload.backgroundSocketEnabled ?? false,
        })
      })
    )
)
