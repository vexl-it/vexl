import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect/index'
import {createClientInstance} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {
  type GetGeocodedCoordinatesRequest,
  type GetLocationSuggestionsRequest,
} from './contracts'
import {LocationApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  language,
  appSource,
  isDeveloper,
  getUserSessionCredentials,
  signal,
  loggingFunction,
  deviceModel,
  osVersion,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  language: string
  appSource: AppSource
  isDeveloper: boolean
  clientSemver: SemverString
  url: ServiceUrl
  deviceModel?: string
  osVersion?: string
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: LocationApiSpecification,
        platform,
        clientVersion,
        language,
        isDeveloper,
        appSource,
        clientSemver,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
      })
    )

    return {
      getLocationSuggestions: (query: GetLocationSuggestionsRequest) =>
        client.getLocationSuggestion({
          urlParams: query,
        }),
      getGeocodedCoordinates: (query: GetGeocodedCoordinatesRequest) =>
        client.getGeocodedCoordinates({
          urlParams: query,
        }),
    }
  })
}

export type LocationApi = Effect.Effect.Success<ReturnType<typeof api>>
