import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
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
  getUserSessionCredentials,
  signal,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
}) {
  return {
    getLocationSuggestions: (
      getLocationSuggestionsInput: GetLocationSuggestionsInput,
      signal?: AbortSignal
    ) =>
      handleCommonErrorsEffect(
        createClientInstanceWithAuth({
          api: LocationApiSpecification,
          platform,
          clientVersion,
          clientSemver,
          getUserSessionCredentials,
          url,
          signal,
          loggingFunction,
        }).getLocationSuggestion(getLocationSuggestionsInput)
      ),
    getGeocodedCoordinates: (
      getGeocodedCoordinatesInput: GetGeocodedCoordinatesInput,
      signal?: AbortSignal
    ) =>
      handleCommonAndExpectedErrorsEffect(
        createClientInstanceWithAuth({
          api: LocationApiSpecification,
          platform,
          clientVersion,
          clientSemver,
          getUserSessionCredentials,
          url,
          signal,
          loggingFunction,
        }).getGeocodedCoordinates(getGeocodedCoordinatesInput),
        GetGeocodedCoordinatesErrors
      ),
  }
}

export type LocationApi = ReturnType<typeof api>
