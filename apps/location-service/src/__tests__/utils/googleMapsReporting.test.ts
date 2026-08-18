import {
  GetGeocodedCoordinatesRequest,
  GetLocationSuggestionsRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Effect, Redacted, Schema} from 'effect'
import {googleGeocode} from '../../utils/googleMapsApi/geocode'
import {querySuggest} from '../../utils/googleMapsApi/suggest'

const apiKey = 'sensitive-google-api-key'
const phrase = 'sensitive-search-phrase'
const latitude = '50.123456'
const longitude = '14.654321'

const unsafeAxiosError = {
  isAxiosError: true,
  message: `Request with ${phrase} at ${latitude},${longitude} failed using ${apiKey}`,
  config: {
    params: {address: phrase, key: apiKey, latlng: `${latitude},${longitude}`},
  },
  response: {
    status: 503,
    data: {error_message: `Rejected ${phrase} using ${apiKey}`},
  },
}

const expectSerializedFailureToExcludeApiKey = (
  serializedFailure: string
): void => {
  expect(serializedFailure).toContain('GoogleMapsError')
  expect(serializedFailure).not.toContain(apiKey)
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('Google Maps error reporting', () => {
  it('keeps the failed suggestion query inspectable without exposing the API key', async () => {
    jest.spyOn(axios, 'get').mockRejectedValueOnce(unsafeAxiosError)

    const result = await Effect.runPromise(
      querySuggest(Redacted.make(apiKey))(
        new GetLocationSuggestionsRequest({lang: 'en', phrase})
      ).pipe(Effect.either)
    )
    const serializedFailure = JSON.stringify(result)

    expectSerializedFailureToExcludeApiKey(serializedFailure)
    expect(serializedFailure).toContain('RequestFailed')
    expect(serializedFailure).toContain(phrase)
    expect(serializedFailure).toContain('503')
  })

  it('keeps the failed geocode query inspectable without exposing the API key', async () => {
    jest.spyOn(axios, 'get').mockRejectedValueOnce(unsafeAxiosError)

    const request = Schema.decodeSync(GetGeocodedCoordinatesRequest)({
      lang: 'en',
      latitude,
      longitude,
    })
    const result = await Effect.runPromise(
      googleGeocode(Redacted.make(apiKey))(request).pipe(Effect.either)
    )
    const serializedFailure = JSON.stringify(result)

    expectSerializedFailureToExcludeApiKey(serializedFailure)
    expect(serializedFailure).toContain('RequestFailed')
    expect(serializedFailure).toContain(latitude)
    expect(serializedFailure).toContain('14.6543')
    expect(serializedFailure).toContain('503')
  })

  it('keeps a rejected Google response inspectable', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        status: 'REQUEST_DENIED',
        error_message: `Rejected ${phrase}`,
        results: [],
      },
    })

    const result = await Effect.runPromise(
      querySuggest(Redacted.make(apiKey))(
        new GetLocationSuggestionsRequest({lang: 'en', phrase})
      ).pipe(Effect.either)
    )
    const serializedFailure = JSON.stringify(result)

    expectSerializedFailureToExcludeApiKey(serializedFailure)
    expect(serializedFailure).toContain('ResponseRejected')
    expect(serializedFailure).toContain('REQUEST_DENIED')
    expect(serializedFailure).toContain(`Rejected ${phrase}`)
  })

  it('preserves Google response validation details', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        status: 'OK',
        results: [
          {
            formatted_address: 'Inspectable result',
            place_id: 'inspectable-result',
            geometry: {
              location: {lat: 200, lng: 14.4},
              viewport: {
                northeast: {lat: 200, lng: 14.5},
                southwest: {lat: 199, lng: 14.3},
              },
            },
          },
        ],
      },
    })

    const result = await Effect.runPromise(
      querySuggest(Redacted.make(apiKey))(
        new GetLocationSuggestionsRequest({lang: 'en', phrase})
      ).pipe(Effect.either)
    )
    const serializedFailure = JSON.stringify(result)

    expect(serializedFailure).toContain('ParseError')
    expect(serializedFailure).toContain('actual 200')
  })
})
