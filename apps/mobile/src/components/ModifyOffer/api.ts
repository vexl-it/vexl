import type * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {location} from '@vexl-next/rest-api'
import {
  type GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/dist/services/location/contracts'
import {platform} from '../../api'
import {ServiceUrl} from '@vexl-next/rest-api/dist/ServiceUrl.brand'
import {useCallback} from 'react'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/dist/utils/ExtractLeft'
import {type LocationPublicApi} from '@vexl-next/rest-api/dist/services/location'

export type ApiErrorLocation = ExtractLeftTE<
  ReturnType<LocationPublicApi['getLocationSuggestions']>
>

export function useGetLocationSuggestions(): (
  request: GetLocationSuggestionsRequest
) => TE.TaskEither<ApiErrorLocation, GetLocationSuggestionsResponse> {
  return useCallback((request) => {
    const locationApi = location.publicApi({
      platform,
      url: ServiceUrl.parse('https://location.vexl.it'),
    })
    return pipe(locationApi.getLocationSuggestions(request))
  }, [])
}
