import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option} from 'effect'
import {rerequestLimitDaysConfig} from '../configs'

export const getVersionServiceInfoHandler = makeHttpApiHandler(
  UserApiSpecification,
  'root',
  'getVersionServiceInfo',
  () =>
    Effect.gen(function* () {
      const rerequestLimitDays = yield* rerequestLimitDaysConfig
      return {
        requestForceUpdate: false,
        maintenanceUntil: Option.none(),
        offerRerequestLimitDays: rerequestLimitDays,
      }
    }).pipe(makeEndpointEffect)
)
