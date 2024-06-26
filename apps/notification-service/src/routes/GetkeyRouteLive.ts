import {HttpRouter, HttpServerResponse} from '@effect/platform'
import {GetPublicKeyResponseE} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect} from 'effect'
import {EnvironmentConstants} from '../EnvironmentLayer'

const GetKeyRouteLive = HttpRouter.get(
  '/cypher-public-key',
  EnvironmentConstants.FCM_TOKEN_PUBLIC_KEY.pipe(
    Effect.flatMap((fcmToken) =>
      HttpServerResponse.schemaJson(GetPublicKeyResponseE)({
        publicKey: fcmToken,
      })
    )
    // Effect.provide(AuthenticatedSessionInRequestLive)
  )
)

export default GetKeyRouteLive
