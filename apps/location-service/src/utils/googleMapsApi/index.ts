import {Context, Effect, Layer} from 'effect'
import {googlePlacesApiKeyConfig} from '../../configs'
import {googleGeocode} from './geocode'
import {querySuggest} from './suggest'

export interface GoogleMapsOperations {
  queryGeocode: ReturnType<typeof googleGeocode>
  querySuggest: ReturnType<typeof querySuggest>
}

export class GoogleMapsService extends Context.Service<
  GoogleMapsService,
  GoogleMapsOperations
>()('GoogleMapsService') {
  static readonly Live = Layer.effect(
    GoogleMapsService,
    Effect.gen(function* () {
      const apiKey = yield* googlePlacesApiKeyConfig

      return {
        queryGeocode: googleGeocode(apiKey),
        querySuggest: querySuggest(apiKey),
      }
    })
  )
}
