import * as translations from '@vexl-next/localization/src/translations'

/**
 * Shared vocabulary for the in-house places database. Used by the service
 * queries and by scripts/ingest.ts, so the ingested data and the
 * search-time normalization can never drift apart.
 */

/**
 * Languages the app ships with — the only translations worth storing. Derived
 * from the same module the app reads its translations from, so a new
 * language flows through automatically on the next places ingest (weekly
 * cron) instead of relying on someone remembering to update this list.
 */
export const SUPPORTED_LANGS = Object.keys(translations).filter(
  (lang) => lang !== 'dev'
)

/**
 * OSM place=* values that represent settlements people would pick as an offer
 * location. Everything else (locality, farm, island, square, …) is noise for
 * our use case.
 */
export const SETTLEMENT_TYPE_WEIGHTS: Record<string, number> = {
  city: 1,
  town: 0.8,
  municipality: 0.7,
  borough: 0.6,
  village: 0.5,
  suburb: 0.45,
  quarter: 0.4,
  neighbourhood: 0.35,
  hamlet: 0.3,
  city_block: 0.2,
}

/**
 * Cities and towns: self-sufficient labels ("Jaroměř") that give everything
 * below them its "…, City" context.
 */
export const CITY_TYPES = ['city', 'town'] as const

/**
 * The finest city-level unit, but it can be a single village — it labels a
 * pin when nothing finer covers it and still reads "…, NearestCity".
 */
export const MUNICIPALITY_TYPE = 'municipality'

/** Everything below city level: the first part of a "Letná, Praha" label. */
export const SUB_CITY_TYPES = [
  'borough',
  'village',
  'suburb',
  'quarter',
  'neighbourhood',
  'hamlet',
  'city_block',
]

export const isCityType = (placeType: string): boolean =>
  CITY_TYPES.some((one) => one === placeType)

// ---------------------------------------------------------------------------
// Boundary polygons (reverse geocoding by containment)
// ---------------------------------------------------------------------------

/**
 * Boundary polygons are simplified at ingest to roughly 10 m — the label is a
 * rough location, and a pin this close to a border is ambiguous anyway. The
 * match tolerance at query time covers the slivers two independently
 * simplified neighbours can leave between them.
 */
export const BOUNDARY_SIMPLIFY_TOLERANCE_DEG = 0.0001
export const BOUNDARY_MATCH_TOLERANCE_DEG = 0.0002

/**
 * What a boundary means for the label: `subCity` boundaries are the first
 * part of it ("Letná"), `city` boundaries label a pin nothing finer covers
 * and — when they are a city/town — give the "…, City" context; `ignore`
 * boundaries are stored only so a country can be re-mapped without a
 * re-ingest.
 */
export type BoundaryRole = 'city' | 'subCity' | 'ignore'

export interface BoundaryClassification {
  countryCode: string | null
  boundaryType: string
  adminLevel: number | null
  placeTag: string | null
}

const DEFAULT_ADMIN_LEVEL_ROLES: Record<number, BoundaryRole> = {
  8: 'city',
  9: 'subCity',
  10: 'subCity',
  11: 'subCity',
}

/**
 * Countries whose admin_level semantics deviate from the default (Nominatim's
 * address-levels are the reference for which ones do). Only list levels that
 * differ; anything missing falls back to the default table. Roles are
 * resolved at query time, so fixing a country here needs no re-ingest.
 */
const COUNTRY_ADMIN_LEVEL_ROLES: Record<
  string,
  Record<number, BoundaryRole>
> = {
  // Katastralgemeinden ("Katastralgemeinde Leopoldstadt") sit at level 10;
  // the Bezirke of Wien and Graz at level 9 are the useful sub-city unit
  at: {10: 'ignore'},
  // Nordic municipalities (kommune/kommun) sit at level 7
  dk: {7: 'city'},
  no: {7: 'city'},
  se: {7: 'city'},
  // concelho / freguesia
  pt: {7: 'city', 8: 'subCity'},
}

/**
 * A place=* tag on the boundary is the most direct statement of what it is
 * and wins over the administrative level; cadastral boundaries are a Czech
 * extra (katastrální území — "Holešovice"); everything else maps by country
 * and admin level.
 */
export const boundaryRole = ({
  countryCode,
  boundaryType,
  adminLevel,
  placeTag,
}: BoundaryClassification): BoundaryRole => {
  if (placeTag !== null) {
    if (isCityType(placeTag) || placeTag === MUNICIPALITY_TYPE) return 'city'
    if (SUB_CITY_TYPES.includes(placeTag)) return 'subCity'
  }
  if (boundaryType === 'cadastral')
    return countryCode === 'cz' ? 'subCity' : 'ignore'
  if (adminLevel === null) return 'ignore'
  return (
    (countryCode !== null
      ? COUNTRY_ADMIN_LEVEL_ROLES[countryCode]?.[adminLevel]
      : undefined) ??
    DEFAULT_ADMIN_LEVEL_ROLES[adminLevel] ??
    'ignore'
  )
}

/**
 * Place type reported for a boundary result: the boundary's own place tag
 * when it has one, otherwise a generic type of its role (drives the viewport
 * size and whether the label gets "…, City" context).
 */
export const boundaryPlaceType = (
  role: BoundaryRole,
  placeTag: string | null
): string => placeTag ?? (role === 'city' ? MUNICIPALITY_TYPE : 'suburb')

/**
 * OSM highway=* values that carry street names people would search for.
 * Service roads, tracks, paths etc. are excluded on purpose.
 */
export const STREET_HIGHWAY_TYPES = new Set([
  'residential',
  'living_street',
  'pedestrian',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
])

/**
 * POI tags worth indexing (public meeting spots) → our place_type. Kept
 * deliberately small; exact addresses and the full POI universe are out of
 * scope.
 */
export const POI_TAG_TYPES: ReadonlyArray<{
  tag: string
  values: Record<string, string>
}> = [
  {
    tag: 'amenity',
    values: {
      cafe: 'cafe',
      restaurant: 'restaurant',
      pub: 'pub',
      bar: 'bar',
      fast_food: 'fast_food',
    },
  },
  {tag: 'leisure', values: {park: 'park', garden: 'garden'}},
  {tag: 'tourism', values: {attraction: 'attraction', museum: 'museum'}},
]

/**
 * Weights for non-settlement types. All far below the 0.55 "important"
 * threshold, so streets/POIs never enter the fast phase-A search or the
 * typo-tolerant trigram fallback, and settlements always outrank them.
 */
export const EXTRA_TYPE_WEIGHTS: Record<string, number> = {
  street: 0.24,
  park: 0.22,
  attraction: 0.22,
  museum: 0.22,
  garden: 0.18,
  cafe: 0.16,
  restaurant: 0.16,
  pub: 0.16,
  bar: 0.16,
  fast_food: 0.14,
}

/**
 * Lowercase letters NFKD can't decompose to a base letter + combining mark,
 * mapped to their ASCII transliterations so "Łódź" matches "lodz". Covers the
 * letters that occur in real place names: Polish ł, Nordic ø/æ/ð/þ, French œ,
 * German ß, Croatian/Vietnamese đ, Turkish ı, Maltese ħ, Azerbaijani ə, Sami
 * ŋ/ŧ/ǥ, Greenlandic ĸ, Hausa/Fula ɓ/ɗ/ƙ/ƴ, West African ɛ/ɔ, and the
 * modifier-letter apostrophes used by Uzbek (oʻ) and Polynesian names (ʻokina),
 * folded to the ASCII apostrophe.
 */
const NON_DECOMPOSABLE_LETTERS: Record<string, string> = {
  ł: 'l',
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ß: 'ss',
  ı: 'i',
  ħ: 'h',
  ə: 'e',
  ǝ: 'e',
  ɛ: 'e',
  ɔ: 'o',
  ŋ: 'n',
  ŧ: 't',
  ǥ: 'g',
  ĸ: 'k',
  ɓ: 'b',
  ɗ: 'd',
  ƙ: 'k',
  ƴ: 'y',
  ʻ: "'",
  ʼ: "'",
}

const NON_DECOMPOSABLE_LETTERS_REGEX = new RegExp(
  `[${Object.keys(NON_DECOMPOSABLE_LETTERS).join('')}]`,
  'g'
)

/**
 * Search-time and ingest-time name normalization. Lowercase + strip combining
 * diacritics so "Vídeň" matches "viden". Non-latin scripts pass through
 * unchanged (trigram search still works on them).
 */
export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(
      NON_DECOMPOSABLE_LETTERS_REGEX,
      (letter) => NON_DECOMPOSABLE_LETTERS[letter] ?? letter
    )
    .trim()

/**
 * Ranking score in [0, 1]: mostly the settlement type, boosted by population.
 * Persisted at ingest time; 0.55 is the "important place" partial-index
 * threshold used for short-query search (see migration 0001).
 */
export const computeImportance = (
  placeType: string,
  population: number | undefined
): number => {
  const typeWeight =
    SETTLEMENT_TYPE_WEIGHTS[placeType] ?? EXTRA_TYPE_WEIGHTS[placeType] ?? 0
  const popScore =
    population !== undefined && population > 0
      ? Math.min(1, Math.log10(population + 1) / 7)
      : 0
  return typeWeight * 0.7 + popScore * 0.3
}

/**
 * Viewport half-size in latitude degrees per settlement type — how far the
 * map should zoom when the place is selected.
 */
const VIEWPORT_LAT_RADIUS_DEG: Record<string, number> = {
  city: 0.09,
  municipality: 0.09,
  town: 0.045,
  borough: 0.02,
  village: 0.018,
  suburb: 0.018,
  quarter: 0.012,
  neighbourhood: 0.009,
  hamlet: 0.009,
  city_block: 0.005,
  street: 0.005,
  park: 0.005,
  garden: 0.004,
  attraction: 0.004,
  museum: 0.003,
  cafe: 0.002,
  restaurant: 0.002,
  pub: 0.002,
  bar: 0.002,
  fast_food: 0.002,
}

export const viewportLatRadiusDeg = (placeType: string): number =>
  VIEWPORT_LAT_RADIUS_DEG[placeType] ?? 0.01
