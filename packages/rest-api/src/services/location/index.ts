import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  GetGeocodedCoordinatesErrors,
  type GetGeocodedCoordinatesInput,
  type GetLocationSuggestionsInput,
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
  const client = createClientInstanceWithAuth({
    api: LocationApiSpecification,
    platform,
    clientVersion,
    language,
    isDeveloper,
    appSource,
    clientSemver,
    getUserSessionCredentials,
    url,
    loggingFunction,
    deviceModel,
    osVersion,
  })

  return {
    getLocationSuggestions: (
      getLocationSuggestionsInput: GetLocationSuggestionsInput
    ) =>
      handleCommonErrorsEffect(
        client.getLocationSuggestion(getLocationSuggestionsInput)
      ),
    getGeocodedCoordinates: (
      getGeocodedCoordinatesInput: GetGeocodedCoordinatesInput
    ) =>
      handleCommonAndExpectedErrorsEffect(
        client.getGeocodedCoordinates(getGeocodedCoordinatesInput),
        GetGeocodedCoordinatesErrors
      ),
  }
}

export type LocationApi = ReturnType<typeof api>
