import axios from 'axios'
import {LocationData, type SuggestQueryData} from '../brands.js'

const API_KEY = process.env.API_KEY ?? ''
if (!API_KEY) {
  throw new Error('API_KEY env var not set!')
}

export async function querySuggest({
  phrase,
  count,
  lang,
}: SuggestQueryData): Promise<LocationData[]> {
  const {data} = await axios.get(
    'https://api.geoapify.com/v1/geocode/autocomplete',
    {
      params: {
        limit: count,
        text: phrase,
        language: lang,
        type: 'city',
        apiKey: API_KEY,
      },
    }
  )

  return data.features
    .map(({properties}: any) => {
      const parsed = LocationData.safeParse({
        suggestFirstRow: properties.address_line1 ?? '',
        suggestSecondRow: properties.address_line2 ?? '',
        municipality: properties.city ?? properties.municipality ?? '',
        region: properties.region ?? '',
        country: properties.country ?? '',
        latitude: properties.lat,
        longitude: properties.lon,
      })
      if (!parsed.success) {
        console.error(
          'Error parsing received data into LocationData',
          parsed.error,
          properties
        )
        return null
      }
      return parsed.data
    })
    .filter(Boolean)
}
