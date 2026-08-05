import {MapStyleUrlsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ignoreReportErrors} from '../../../utils/reportError'
import {FALLBACK_MAP_STYLE_URLS} from '../utils/mapStyle'

// Persisted so a content service outage does not fall all the way back to the
// bundled URLs - the last known good provider keeps working offline too.
export const mapStyleUrlsAtom = atomWithParsedMmkvStorage(
  'mapStyleUrls',
  FALLBACK_MAP_STYLE_URLS,
  MapStyleUrlsResponse
)

export const loadMapStyleUrlsActionAtom = atom(null, (get, set) => {
  const contentApi = get(apiAtom).content

  return contentApi.getMapStyleUrls().pipe(
    Effect.tap((response) =>
      Effect.sync(() => {
        set(mapStyleUrlsAtom, response)
      })
    ),
    ignoreReportErrors('warn', 'Error loading map style urls')
  )
})
