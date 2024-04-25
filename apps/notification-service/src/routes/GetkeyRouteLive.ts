import * as Http from '@effect/platform/HttpServer'
import {GetPublicKeyResponseE} from '@vexl-next/rest-api/src/services/notification/contract'
import {AuthenticatedSessionInRequestLive} from '@vexl-next/server-utils/src/ServerUserSession'
import {Effect} from 'effect'
import {EnvironmentConstants} from '../EnvironmentLayer'

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
