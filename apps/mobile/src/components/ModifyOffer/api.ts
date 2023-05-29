import type * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {
  type GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/dist/services/location/contracts'
import {useLocationPublicApi} from '../../api'
import {useCallback} from 'react'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/dist/utils/ExtractLeft'
import {type LocationPublicApi} from '@vexl-next/rest-api/dist/services/location'

export type ApiErrorLocation = ExtractLeftTE<
  ReturnType<LocationPublicApi['getLocationSuggestions']>
>

export function useGetLocationSuggestions(): (
  request: GetLocationSuggestionsRequest
) => TE.TaskEither<ApiErrorLocation, GetLocationSuggestionsResponse> {
  const locationApi = useLocationPublicApi()
  return useCallback(
    (request) => {
      return pipe(locationApi.getLocationSuggestions(request))
    },
    [locationApi]
  )
}
