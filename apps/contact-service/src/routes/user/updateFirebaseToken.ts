import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {UpdateFirebaseTokenEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Metric, Option} from 'effect'
import {Handler} from 'effect-http'
import {UserDbService} from '../../db/UserDbService'
import {userRefreshGauge} from '../../metrics'

export const updateFirebaseToken = Handler.make(
  UpdateFirebaseTokenEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(Metric.increment(userRefreshGauge))
        const userDb = yield* _(UserDbService)

        yield* _(
          userDb.updateFirebaseToken({
            publicKey: security['public-key'],
            hash: security.hash,
            firebaseToken: Option.fromNullable(req.body.firebaseToken),
          })
        )
      }),
      UserNotFoundError
    )
)
