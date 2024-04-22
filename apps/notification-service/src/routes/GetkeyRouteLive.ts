import * as Http from '@effect/platform/HttpServer'
import {GetPublicKeyResponseE} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect} from 'effect'
import {EnvironmentConstants} from '../EnvironmentLayer'
import {AuthenticatedSessionInRequestLive} from '../validateUserSession'

const GetKeyRouteLive = Http.router.get(
  '/cypher-public-key',
  EnvironmentConstants.FCM_TOKEN_PUBLIC_KEY.pipe(
    Effect.flatMap((fcmToken) =>
      Http.response.schemaJson(GetPublicKeyResponseE)({publicKey: fcmToken})
    ),
    Effect.provide(AuthenticatedSessionInRequestLive)
  )
)

export default GetKeyRouteLive
