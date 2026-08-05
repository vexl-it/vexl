import {TransformRequestManager} from '@maplibre/maplibre-react-native'

// MapLibre Native builds its default User-Agent from the host app - on iOS it
// embeds the bundle name / identifier - which would let the tile provider
// attribute every map request to Vexl. Since the tiles are served by a
// third party shared with the rest of the internet, that attribution is the
// only thing standing between "somebody looked at this area" and "a Vexl user
// looked at this area".
//
// One static, app-agnostic value keeps every Vexl install indistinguishable
// from every other MapLibre client. Deliberately carries no app name, version,
// OS or device details - those would only add entropy to fingerprint on.
//
// Registered without a `match` so it applies to style, glyph, sprite and tile
// requests alike, and keeps applying if the backend-served style URLs point at
// a different provider (see `mapStyleUrlsAtoms.ts`).
//
// Imported from `index.js` rather than from the map components: on Android the
// native side installs the interceptor on the UI queue (see
// MLRNTransformRequestModule.addHeader), so registering it at startup leaves no
// window in which a map could mount and request resources with the default
// header still in place.
const NEUTRAL_USER_AGENT = 'MapLibre'

TransformRequestManager.addHeader({
  id: 'neutral-user-agent',
  name: 'User-Agent',
  value: NEUTRAL_USER_AGENT,
})
