import axios from 'axios'
import {
  LocationResponse,
  type LocationData,
  type SuggestQueryData,
} from '../brands'
import env from '../environment'

interface GooglePlacesResponse {
  results: Array<{
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
      viewport: {
        northeast: {
          lat: number
          lng: number
        }
        southwest: {
          lat: number
          lng: number
        }
      }
    }
    types: string[]
  }>
}

export async function querySuggest({
  phrase,
  lang,
}: SuggestQueryData): Promise<LocationResponse> {
  const {
    data: {results},
  } = await axios.get<GooglePlacesResponse>(
    'https://maps.googleapis.com/maps/api/geocode/json',
    {
      params: {
        address: phrase,
        key: env.GOOGLE_PLACES_API_KEY,
        language: lang,
      },
    }
  )

  const resultsRaw = results.map((one) => {
    const [firstRow, ...rest] = one.formatted_address.split(', ')
    const secondRow: string = rest.join(', ')
    return {
      userData: {
        suggestFirstRow: firstRow,
        suggestSecondRow: secondRow,
        latitude: one.geometry.location.lat,
        longitude: one.geometry.location.lng,
        viewport: {
          northeast: {
            latitude: one.geometry.viewport.northeast.lat,
            longitude: one.geometry.viewport.northeast.lng,
          },
          southwest: {
            latitude: one.geometry.viewport.southwest.lat,
            longitude: one.geometry.viewport.southwest.lng,
          },
        },
        municipality: firstRow,
        region: secondRow,
        country: secondRow,
      } satisfies LocationData,
    }
  })

  return LocationResponse.parse({
    result: resultsRaw,
  } satisfies LocationResponse)
}
