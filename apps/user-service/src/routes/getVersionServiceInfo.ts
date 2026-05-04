import {HttpApiBuilder} from '@effect/platform/index'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {rerequestLimitDaysConfig} from '../configs'

export const getVersionServiceInfoHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'root',
  'getVersionServiceInfo',
  () =>
    Effect.gen(function* (_) {
      const rerequestLimitDays = yield* _(rerequestLimitDaysConfig)
      return {
        requestForceUpdate: false,
        maintenanceUntil: Option.none(),
        offerRerequestLimitDays: rerequestLimitDays,
      }
    }).pipe(makeEndpointEffect)
)
