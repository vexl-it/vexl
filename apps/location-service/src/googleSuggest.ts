import 'dotenv/config'
import axios from 'axios'
import {LocationData, type SuggestQueryData} from './brands'

const GOOGLE_PLACES_API_KEY = String(process.env.GOOGLE_PLACES_API_KEY ?? '')
if (!GOOGLE_PLACES_API_KEY)
  throw new Error('No GOOGLE_PLACES_API_KEY env var set!')

interface GooglePlacesResponse {
  results: Array<{
    formatted_address: string
    name: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
}

function extractCountry(formattedAddress: string): string {
  const split = formattedAddress.split(',')
  return split[split.length - 1].trim()
}

export async function querySuggest({
  phrase,
  lang,
}: SuggestQueryData): Promise<LocationData[]> {
  const {
    data: {results},
  } = await axios.get<GooglePlacesResponse>(
    'https://maps.googleapis.com/maps/api/place/textsearch/json',
    {
      params: {
        query: phrase,
        key: GOOGLE_PLACES_API_KEY,
        type: 'locality',
        language: lang,
      },
    }
  )

  return results
    .map((one) =>
      LocationData.safeParse({
        suggestFirstRow: one.name,
        suggestSecondRow: extractCountry(one.formatted_address),
        latitude: one.geometry.location.lat,
        longitude: one.geometry.location.lng,
        municipality: one.name,

        // TODO remove once the support for old version of the app is dropped
        region: '',
        country: '',
      })
    )
    .map((one) => (one.success ? one.data : null))
    .filter((one): one is NonNullable<typeof one> => one !== null)
}
