import {MapStyleJson} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {currentAppLanguageAtom} from '../../../utils/preferences'
import reportError, {ignoreReportErrors} from '../../../utils/reportError'
import {localizeMapStyleLabels} from '../utils/localizeMapStyleLabels'

// Used until the backend-served styles are fetched for the first time, and
// whenever the content service cannot be reached before that. MapLibre accepts
// a style URL string in place of a style JSON; labels are not localized here.
const FALLBACK_MAP_STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

const StoredMapStyles = Schema.Struct({
  light: Schema.optional(MapStyleJson),
  dark: Schema.optional(MapStyleJson),
})

// The raw style documents as served by the content service, persisted so the
// map keeps working offline and across content service outages.
export const mapStyleJsonsAtom = atomWithParsedMmkvStorage(
  'mapStyleJsons',
  {},
  StoredMapStyles
)

export const loadMapStylesActionAtom = atom(null, (get, set) =>
  get(apiAtom)
    .content.getMapStyles()
    .pipe(
      Effect.tap((styles) =>
        Effect.sync(() => {
          set(mapStyleJsonsAtom, styles)
        })
      ),
      ignoreReportErrors('warn', 'Error loading map styles')
    )
)

// Style documents with place-name labels rewritten to the app language.
export const localizedMapStylesAtom = atom((get) => {
  const styleJsons = get(mapStyleJsonsAtom)
  const language = get(currentAppLanguageAtom)

  const localized = (theme: 'light' | 'dark'): string => {
    const styleJson = styleJsons[theme]
    if (styleJson === undefined) return FALLBACK_MAP_STYLE_URLS[theme]

    const result = localizeMapStyleLabels(styleJson, language)
    if (result === null) {
      reportError(
        'warn',
        new Error('Failed to localize map style labels, using raw style'),
        {theme, language}
      )
      return styleJson
    }
    return result
  }

  return {light: localized('light'), dark: localized('dark')}
})
