import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {trustedFriendsEnabledConfig} from '../configs'

export const getFeatureFlagsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'FeatureFlags',
  'getFeatureFlags',
  () =>
    Effect.all({trustedFriends: trustedFriendsEnabledConfig}).pipe(
      Effect.catchAll(
        (e) =>
          new UnexpectedServerError({
            cause: e,
            status: 500,
          })
      ),
      Effect.withSpan('getFeatureFlags'),
      makeEndpointEffect
    )
)
