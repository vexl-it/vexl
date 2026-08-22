/**
 * Pure parsing/transform layer of the places ingest: geojsonseq feature
 * parsing, OSM id encoding and the country point-in-polygon index. No side
 * effects — imported by scripts/ingest.ts and unit-tested directly.
 */
import {
  computeImportance,
  normalizeName,
  POI_TAG_TYPES,
  SETTLEMENT_TYPE_WEIGHTS,
  STREET_HIGHWAY_TYPES,
  SUPPORTED_LANGS,
} from '@vexl-next/geocoding-db/src/common'

/** ~10 km grid used to merge street segments into one entry per street. */
export const STREET_GRID_CELLS_PER_DEGREE = 10

export interface PlaceRow {
  id: string
  place_type: string
  name: string
  names: Record<string, string>
  country_code: string | null
  population: string | null
  importance: number
  latitude: number
  longitude: number
  geom_rank: number
}

export interface PlaceNameRow {
  place_id: string
  norm_name: string
  importance: number
}

export interface StreetSegmentRow {
  seg_id: string
  norm_name: string
  name: string
  country_code: string | null
  latitude: number
  longitude: number
  grid_lat: number
  grid_lon: number
}

export interface BoundaryRow {
  id: string
  name: string
  names: Record<string, string>
  country_code: string | null
  boundary_type: 'administrative' | 'cadastral' | 'place'
  admin_level: number | null
  place_tag: string | null
  geometry_json: string
}

// ---------------------------------------------------------------------------
// Country lookup: point-in-polygon against Natural Earth admin-0 countries.
//
// A 1° grid maps each cell to the polygon rings whose bbox overlaps it. Cells
// whose candidate rings all belong to one country resolve without ray casting
// (settlements are always on land, so a single candidate is the answer).
// Only cells near land borders pay for the exact point-in-ring test.
// ---------------------------------------------------------------------------

interface CountryRing {
  countryCode: string
  // Outer ring or hole; holes subtract from containment via even-odd rule
  ring: Array<[number, number]>
  bbox: [number, number, number, number]
}

export const ringBbox = (
  ring: Array<[number, number]>
): [number, number, number, number] => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return [minX, minY, maxX, maxY]
}

const isPolygonCoordinates = (
  value: unknown
): value is Array<Array<[number, number]>> =>
  Array.isArray(value) &&
  value.every(
    (ring) =>
      Array.isArray(ring) &&
      ring.every(
        (point) =>
          Array.isArray(point) &&
          typeof point[0] === 'number' &&
          typeof point[1] === 'number'
      )
  )

const pointInRing = (
  x: number,
  y: number,
  ring: Array<[number, number]>
): boolean => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export class CountryIndex {
  private readonly grid = new Map<number, CountryRing[]>()
  private readonly polygons = new Map<string, CountryRing[][]>()

  private cellKey(lon: number, lat: number): number {
    return (Math.floor(lon) + 180) * 200 + (Math.floor(lat) + 90)
  }

  constructor(geojson: {
    features: Array<{
      properties: Record<string, unknown>
      geometry: {type: string; coordinates: unknown}
    }>
  }) {
    for (const feature of geojson.features) {
      const props = feature.properties
      const isoCandidates = [props.ISO_A2_EH, props.ISO_A2, props.WB_A2]
      const iso = isoCandidates.find(
        (one) => typeof one === 'string' && /^[A-Za-z]{2}$/.test(one)
      )
      if (typeof iso !== 'string') continue
      const countryCode = iso.toLowerCase()

      const rawCoordinates = feature.geometry.coordinates
      const geometryPolygons: Array<Array<Array<[number, number]>>> = []
      if (
        feature.geometry.type === 'Polygon' &&
        isPolygonCoordinates(rawCoordinates)
      ) {
        geometryPolygons.push(rawCoordinates)
      } else if (
        feature.geometry.type === 'MultiPolygon' &&
        Array.isArray(rawCoordinates)
      ) {
        for (const polygon of rawCoordinates) {
          if (isPolygonCoordinates(polygon)) geometryPolygons.push(polygon)
        }
      }

      for (const polygon of geometryPolygons) {
        if (polygon.length === 0) continue
        const rings: CountryRing[] = polygon.map((ring) => ({
          countryCode,
          ring,
          bbox: ringBbox(ring),
        }))
        const existing = this.polygons.get(countryCode) ?? []
        existing.push(rings)
        this.polygons.set(countryCode, existing)

        // Only the outer ring (first) drives grid candidacy
        const outer = rings[0]
        const [minX, minY, maxX, maxY] = outer.bbox
        for (let lon = Math.floor(minX); lon <= Math.floor(maxX); lon++) {
          for (let lat = Math.floor(minY); lat <= Math.floor(maxY); lat++) {
            const key = (lon + 180) * 200 + (lat + 90)
            const cell = this.grid.get(key)
            if (cell === undefined) this.grid.set(key, [outer])
            else cell.push(outer)
          }
        }
      }
    }
  }

  private pointInCountry(
    lon: number,
    lat: number,
    countryCode: string
  ): boolean {
    const polygons = this.polygons.get(countryCode) ?? []
    for (const rings of polygons) {
      const outer = rings[0]
      const [minX, minY, maxX, maxY] = outer.bbox
      if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue
      if (!pointInRing(lon, lat, outer.ring)) continue
      const inHole = rings
        .slice(1)
        .some(
          (hole) =>
            lon >= hole.bbox[0] &&
            lon <= hole.bbox[2] &&
            lat >= hole.bbox[1] &&
            lat <= hole.bbox[3] &&
            pointInRing(lon, lat, hole.ring)
        )
      if (!inHole) return true
    }
    return false
  }

  lookup(lon: number, lat: number): string | null {
    const candidates = this.grid.get(this.cellKey(lon, lat))
    if (candidates === undefined || candidates.length === 0) return null

    const inBbox = candidates.filter(
      (one) =>
        lon >= one.bbox[0] &&
        lon <= one.bbox[2] &&
        lat >= one.bbox[1] &&
        lat <= one.bbox[3]
    )
    const uniqueCountries = [...new Set(inBbox.map((one) => one.countryCode))]
    if (uniqueCountries.length === 0) return null
    // Settlements are on land — a single candidate country needs no exact test
    if (uniqueCountries.length === 1) return uniqueCountries[0]

    for (const countryCode of uniqueCountries) {
      if (this.pointInCountry(lon, lat, countryCode)) return countryCode
    }
    return uniqueCountries[0]
  }
}

// ---------------------------------------------------------------------------
// geojsonseq feature parsing (osmium export -f geojsonseq)
// ---------------------------------------------------------------------------

export type ParsedFeature =
  | {kind: 'place'; place: PlaceRow; names: PlaceNameRow[]}
  | {kind: 'street'; segment: StreetSegmentRow}
  | {kind: 'boundary'; boundary: BoundaryRow}

/**
 * Administrative levels worth storing: local government (municipalities and
 * their parts) plus the county-ish levels 6-7 some countries use for
 * municipalities. National/regional levels are noise for an offer location.
 */
const MIN_ADMIN_LEVEL = 6
const MAX_ADMIN_LEVEL = 11

const parseAdminLevel = (raw: string | undefined): number | null => {
  if (raw === undefined) return null
  const level = Number.parseInt(raw, 10)
  return Number.isInteger(level) && String(level) === raw.trim() ? level : null
}

/**
 * A point inside the ring: the midpoint of the first span where the ring
 * crosses its own bbox mid-latitude. The bbox centre is not good enough for
 * the country lookup — a crescent-shaped district along a river border has
 * its bbox centre in the neighbouring country.
 */
export const interiorPoint = (
  ring: Array<[number, number]>
): [number, number] | null => {
  const [, minY, , maxY] = ringBbox(ring)
  const y = (minY + maxY) / 2
  const crossings: number[] = []
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y)
      crossings.push(xi + ((y - yi) * (xj - xi)) / (yj - yi))
  }
  crossings.sort((a, b) => a - b)
  return crossings.length >= 2 ? [(crossings[0] + crossings[1]) / 2, y] : null
}

const bboxArea = (ring: Array<[number, number]>): number => {
  const [minX, minY, maxX, maxY] = ringBbox(ring)
  return (maxX - minX) * (maxY - minY)
}

/** Interior point of the largest polygon of a (Multi)Polygon geometry. */
const boundaryInteriorPoint = (geometry: {
  type: string
  coordinates: unknown
}): [number, number] | null => {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)
        ? geometry.coordinates
        : []
  const outerRings = polygons
    .filter(isPolygonCoordinates)
    .map((polygon) => polygon[0])
    .filter((ring) => ring !== undefined)
  if (outerRings.length === 0) return null
  const largest = outerRings.reduce((best, ring) =>
    bboxArea(ring) > bboxArea(best) ? ring : best
  )
  return interiorPoint(largest) ?? geometryCenter(geometry)
}

const isClosedRing = (ring: Array<[number, number]>): boolean =>
  ring.length >= 4 &&
  ring[0][0] === ring[ring.length - 1][0] &&
  ring[0][1] === ring[ring.length - 1][1]

const isValidPolygon = (value: unknown): boolean =>
  isPolygonCoordinates(value) && value.length > 0 && value.every(isClosedRing)

/**
 * Boundary polygons used for reverse geocoding by containment: administrative
 * relations at local levels, Czech cadastral areas and settlements mapped as
 * place=* polygons. Osmium emits every assembled area with an `a` id; the
 * linestring twins of closed ways and unclosed relations are not areas.
 */
const parseBoundary = (
  feature: {
    id: string
    geometry: {type: string; coordinates: unknown}
  },
  props: Record<string, string>,
  name: string,
  encodedId: number,
  countries: CountryIndex
): ParsedFeature | null => {
  if (!feature.id.startsWith('a')) return null

  const placeTag =
    props.place !== undefined &&
    SETTLEMENT_TYPE_WEIGHTS[props.place] !== undefined
      ? props.place
      : null
  const boundaryType =
    props.boundary === 'administrative' || props.boundary === 'cadastral'
      ? props.boundary
      : placeTag !== null
        ? 'place'
        : null
  if (boundaryType === null) return null

  const adminLevel =
    boundaryType === 'administrative'
      ? parseAdminLevel(props.admin_level)
      : null
  // A place-tagged relation is kept whatever its level (Berlin, Wien and
  // Praha are level 4 cities); untagged ones only at the local levels.
  if (
    boundaryType === 'administrative' &&
    placeTag === null &&
    (adminLevel === null ||
      adminLevel < MIN_ADMIN_LEVEL ||
      adminLevel > MAX_ADMIN_LEVEL)
  )
    return null

  const coordinates = feature.geometry.coordinates
  const validGeometry =
    (feature.geometry.type === 'Polygon' && isValidPolygon(coordinates)) ||
    (feature.geometry.type === 'MultiPolygon' &&
      Array.isArray(coordinates) &&
      coordinates.length > 0 &&
      coordinates.every(isValidPolygon))
  if (!validGeometry) return null

  const center = boundaryInteriorPoint(feature.geometry)
  const countryCode =
    center !== null ? countries.lookup(center[0], center[1]) : null
  // Cadastral areas are a Czech-only extra (see common.ts#boundaryRole)
  if (boundaryType === 'cadastral' && countryCode !== 'cz') return null

  return {
    kind: 'boundary',
    boundary: {
      id: String(encodedId),
      name,
      names: pickTranslations(props),
      country_code: countryCode,
      boundary_type: boundaryType,
      admin_level: adminLevel,
      place_tag: placeTag,
      geometry_json: JSON.stringify({
        type: feature.geometry.type,
        coordinates,
      }),
    },
  }
}

/**
 * OSM ids are only unique per object type (node/way/relation), so the id
 * spaces are interleaved into one bigint: node → id*4, way → id*4+1,
 * relation → id*4+2. Max OSM ids (~2^34) stay far below 2^53.
 *
 * Osmium's type_id ids are `n<id>`, `w<id>` and `a<areaId>` — it never emits
 * `r`; areas assembled from closed ways get areaId = 2×wayId and areas from
 * relations get areaId = 2×relationId+1. Decoding areas back to their source
 * object makes a closed way's area and its linestring twin share one id, so
 * the dedupe can collapse them.
 */
export const encodeOsmId = (typedId: string): number | null => {
  const raw = Number(typedId.slice(1))
  if (!Number.isFinite(raw) || raw <= 0) return null
  if (typedId.startsWith('n')) return raw * 4
  if (typedId.startsWith('w')) return raw * 4 + 1
  if (typedId.startsWith('a'))
    return raw % 2 === 0 ? raw * 2 + 1 : (raw - 1) * 2 + 2
  return null
}

/**
 * Polygons outrank other geometries: a closed-way POI arrives both as an `a`
 * polygon and a `w` linestring twin, and the polygon center beats a boundary
 * node picked from the linestring.
 */
const geometryRank = (geometryType: string): number =>
  geometryType === 'Polygon' || geometryType === 'MultiPolygon' ? 1 : 0

const isPositionArray = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number'

/** Representative point of any GeoJSON geometry osmium export produces. */
export const geometryCenter = (geometry: {
  type: string
  coordinates: unknown
}): [number, number] | null => {
  const coords = geometry.coordinates
  if (geometry.type === 'Point' && isPositionArray(coords)) return coords
  if (geometry.type === 'LineString' && Array.isArray(coords)) {
    const middle = coords[Math.floor(coords.length / 2)]
    return isPositionArray(middle) ? middle : null
  }
  if (geometry.type === 'MultiLineString' && Array.isArray(coords)) {
    const first = coords[0]
    if (!Array.isArray(first)) return null
    const middle = first[Math.floor(first.length / 2)]
    return isPositionArray(middle) ? middle : null
  }
  if (
    (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') &&
    Array.isArray(coords)
  ) {
    const ring = geometry.type === 'Polygon' ? coords[0] : coords[0]?.[0]
    if (!isPolygonCoordinates(geometry.type === 'Polygon' ? coords : coords[0]))
      return null
    if (!Array.isArray(ring)) return null
    const [minX, minY, maxX, maxY] = ringBbox(ring)
    return [(minX + maxX) / 2, (minY + maxY) / 2]
  }
  return null
}

const poiTypeOf = (props: Record<string, string>): string | null => {
  for (const {tag, values} of POI_TAG_TYPES) {
    const value = props[tag]
    if (value !== undefined && values[value] !== undefined) return values[value]
  }
  return null
}

const pickTranslations = (
  props: Record<string, string>
): Record<string, string> => {
  const names: Record<string, string> = {}
  for (const lang of SUPPORTED_LANGS) {
    const value = props[`name:${lang}`]
    if (value !== undefined && value.trim() !== '') names[lang] = value
  }
  return names
}

export const parseFeature = (
  line: string,
  countries: CountryIndex
): ParsedFeature | null => {
  // geojsonseq lines are prefixed with an RFC 8142 RS control character
  const cleanLine = line.startsWith('\u001e') ? line.slice(1) : line
  if (cleanLine.trim() === '') return null

  let feature: {
    id?: string
    geometry?: {type: string; coordinates: unknown}
    properties?: Record<string, string>
  }
  try {
    feature = JSON.parse(cleanLine)
  } catch {
    return null
  }

  const props = feature.properties
  const geometry = feature.geometry
  if (props === undefined || geometry === undefined || feature.id === undefined)
    return null

  const name = props.name
  if (name === undefined || name.trim() === '') return null

  const encodedId = encodeOsmId(feature.id)
  if (encodedId === null) return null

  const boundary = parseBoundary(
    {id: feature.id, geometry},
    props,
    name,
    encodedId,
    countries
  )
  if (boundary !== null) return boundary

  const center = geometryCenter(geometry)
  if (center === null) return null
  const [longitude, latitude] = center
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

  // Settlements: place=* nodes only (ways/relations duplicate node places)
  const settlementType = props.place
  if (
    settlementType !== undefined &&
    SETTLEMENT_TYPE_WEIGHTS[settlementType] !== undefined
  ) {
    if (!feature.id.startsWith('n')) return null
    const names = pickTranslations(props)
    const populationRaw = props.population
    const populationParsed =
      populationRaw !== undefined ? Number.parseInt(populationRaw, 10) : NaN
    const population =
      Number.isFinite(populationParsed) &&
      populationParsed > 0 &&
      populationParsed < 100_000_000
        ? populationParsed
        : undefined
    const importance = computeImportance(settlementType, population)
    return {
      kind: 'place',
      place: {
        id: String(encodedId),
        place_type: settlementType,
        name,
        names,
        country_code: countries.lookup(longitude, latitude),
        population: population !== undefined ? String(population) : null,
        importance,
        latitude,
        longitude,
        geom_rank: geometryRank(geometry.type),
      },
      names: normNameRows(String(encodedId), name, names, importance),
    }
  }

  // Streets: named highway ways of street-like types
  const highway = props.highway
  if (highway !== undefined) {
    if (!STREET_HIGHWAY_TYPES.has(highway) || !feature.id.startsWith('w'))
      return null
    const normName = normalizeName(name)
    if (normName.length === 0) return null
    return {
      kind: 'street',
      segment: {
        seg_id: String(encodedId),
        norm_name: normName,
        name,
        country_code: countries.lookup(longitude, latitude),
        latitude,
        longitude,
        grid_lat: Math.round(latitude * STREET_GRID_CELLS_PER_DEGREE),
        grid_lon: Math.round(longitude * STREET_GRID_CELLS_PER_DEGREE),
      },
    }
  }

  // POIs
  const poiType = poiTypeOf(props)
  if (poiType !== null) {
    const names = pickTranslations(props)
    const importance = computeImportance(poiType, undefined)
    return {
      kind: 'place',
      place: {
        id: String(encodedId),
        place_type: poiType,
        name,
        names,
        country_code: countries.lookup(longitude, latitude),
        population: null,
        importance,
        latitude,
        longitude,
        geom_rank: geometryRank(geometry.type),
      },
      names: normNameRows(String(encodedId), name, names, importance),
    }
  }

  return null
}

export const normNameRows = (
  placeId: string,
  name: string,
  names: Record<string, string>,
  importance: number
): PlaceNameRow[] => {
  const normNames = [
    ...new Set(
      [name, ...Object.values(names)]
        .map(normalizeName)
        .filter((one) => one.length > 0)
    ),
  ]
  return normNames.map((normName) => ({
    place_id: placeId,
    norm_name: normName,
    importance,
  }))
}
