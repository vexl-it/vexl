import {MapStyleJson} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Layer, Schema} from 'effect'
import {MapStylesService} from '../../utils/mapStyles'

export const dummyMapStyles = {
  light: Schema.decodeSync(MapStyleJson)(
    JSON.stringify({version: 8, name: 'light', layers: []})
  ),
  dark: Schema.decodeSync(MapStyleJson)(
    JSON.stringify({version: 8, name: 'dark', layers: []})
  ),
}

export const mockedFetchMapStyles = jest.fn(() =>
  Effect.succeed(dummyMapStyles)
)

export const mockedMapStylesService = Layer.succeed(MapStylesService, {
  fetchMapStyles: mockedFetchMapStyles,
})
