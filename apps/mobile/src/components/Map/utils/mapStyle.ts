import {HttpsUrlString} from '@vexl-next/domain/src/utility/HttpsUrlString.brand'
import {type MapStyleUrlsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {Schema} from 'effect'

// Used until the backend-served URLs are fetched for the first time, and
// whenever the content service cannot be reached. The live values come from
// `mapStyleUrlsAtom` so the tile provider can be swapped without an app
// release - see `mapStyleUrlsAtoms.ts`.
export const FALLBACK_MAP_STYLE_URLS: MapStyleUrlsResponse = {
  light: Schema.decodeSync(HttpsUrlString)(
    'https://tiles.openfreemap.org/styles/positron'
  ),
  dark: Schema.decodeSync(HttpsUrlString)(
    'https://tiles.openfreemap.org/styles/dark'
  ),
}
