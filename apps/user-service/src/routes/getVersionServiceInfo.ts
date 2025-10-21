import {HttpApiBuilder} from '@effect/platform/index'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'

export const getVersionServiceInfoHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'root',
  'getVersionServiceInfo',
  (req) =>
    Effect.gen(function* (_) {
      return {
        requestForceUpdate: false,
        maintenanceUntil: Option.none(),
        offerRerequestLimitDays: 1,
      }
    }).pipe(makeEndpointEffect)
)
