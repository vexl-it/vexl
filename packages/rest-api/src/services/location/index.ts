import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
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
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
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
        }).getGeocodedCoordinates(getGeocodedCoordinatesInput),
        GetGeocodedCoordinatesErrors
      ),
  }
}

export type LocationApi = ReturnType<typeof api>
