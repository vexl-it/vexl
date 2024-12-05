import {GetVersionServiceInfoEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'

export const getVersionServiceInfoHandler = Handler.make(
  GetVersionServiceInfoEndpoint,
  (_) =>
    Effect.gen(function* (_) {
      return {
        requestForceUpdate: false,
        maintenanceUntil: Option.none(),
        offerRerequestLimitDays: 1,
      }
    })
)
