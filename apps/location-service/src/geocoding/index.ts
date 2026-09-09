import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {GeocodingDbService} from '@vexl-next/geocoding-db/src/GeocodingDbService'
import {type GeocodingRecordWithContext} from '@vexl-next/geocoding-db/src/GeocodingDbService/domain'
import {type NearestGeocodingRecord} from '@vexl-next/geocoding-db/src/GeocodingDbService/queries/createQueryNearestPlace'
import {
  normalizeName,
  SUPPORTED_LANGS,
} from '@vexl-next/geocoding-db/src/common'
import {
  GetGeocodedCoordinatesResponse,
  GetLocalizedAddressesResponse,
  GetLocationSuggestionsResponse,
  LocationNotFoundError,
  type GetGeocodedCoordinatesRequest,
  type GetLocalizedAddressesRequest,
  type GetLocationSuggestionsRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {Array, Context, Effect, Layer, Option, pipe, Schema} from 'effect'
import {
  buildGeocodeAddress,
  buildGeocodePlaceId,
  buildLocalizedGeocodeAddresses,
  buildLocalizedSuggestAddresses,
  buildSuggestPlaceId,
  buildSuggestSecondRow,
  buildViewport,
  escapeLikePattern,
  localizedName,
  parsePlaceId,
  pickLang,
} from './format'

const SUGGEST_LIMIT = 8
/** Search only "important" places (partial index) before the full search. */
const IMPORTANT_ONLY_THRESHOLD = 0.55
/** Pins farther than this from any settlement resolve to "not found". */
const GEOCODE_MAX_DISTANCE_METERS = 200_000
/**
 * Identically-labeled suggestions closer than this are the same place split
 * across ingest dedupe grid cells (~10 km, see
 * tooling/location-db-updater/scripts/ingest.ts).
 * Distinct same-named settlements sit far apart and must both stay.
 */
const DEDUPE_MAX_DELTA_DEG = 0.25

export interface GeocodingOperations {
  querySuggest: (
    request: GetLocationSuggestionsRequest
  ) => Effect.Effect<GetLocationSuggestionsResponse, UnexpectedServerError>
  queryGeocode: (
    request: GetGeocodedCoordinatesRequest
  ) => Effect.Effect<
    GetGeocodedCoordinatesResponse,
    UnexpectedServerError | LocationNotFoundError
  >
  queryLocalizedAddresses: (
    request: GetLocalizedAddressesRequest
  ) => Effect.Effect<
    GetLocalizedAddressesResponse,
    UnexpectedServerError | LocationNotFoundError
  >
}

const orLocationNotFound = <A>(
  option: Option.Option<A>
): Effect.Effect<A, LocationNotFoundError> =>
  Option.match(option, {
    onNone: () => Effect.fail(new LocationNotFoundError({status: 404})),
    onSome: Effect.succeed,
  })

interface SuggestionUserData {
  placeId: string
  suggestFirstRow: string
  suggestSecondRow: string
  localizedAddresses: Record<string, string>
  latitude: number
  longitude: number
  viewport: ReturnType<typeof buildViewport>
}

const isNearby = (a: SuggestionUserData, b: SuggestionUserData): boolean => {
  const midLatRad = ((a.latitude + b.latitude) / 2) * (Math.PI / 180)
  const lonDelta =
    Math.abs(a.longitude - b.longitude) * Math.max(0.05, Math.cos(midLatRad))
  return (
    Math.abs(a.latitude - b.latitude) <= DEDUPE_MAX_DELTA_DEG &&
    lonDelta <= DEDUPE_MAX_DELTA_DEG
  )
}

const suggestionUserData = (
  record: GeocodingRecordWithContext,
  lang: string
): SuggestionUserData => ({
  placeId: buildSuggestPlaceId(record.id),
  suggestFirstRow: localizedName(record.name, record.names, lang),
  suggestSecondRow: buildSuggestSecondRow(record, lang),
  localizedAddresses: buildLocalizedSuggestAddresses(record, SUPPORTED_LANGS),
  latitude: record.latitude,
  longitude: record.longitude,
  viewport: buildViewport(record.latitude, record.longitude, record.placeType),
})

export class GeocodingService extends Context.Tag('GeocodingService')<
  GeocodingService,
  GeocodingOperations
>() {
  static readonly Live = Layer.effect(
    GeocodingService,
    Effect.gen(function* (_) {
      const geocodingDb = yield* _(GeocodingDbService)

      const findNearestPlace = (coordinates: {
        latitude: number
        longitude: number
      }): Effect.Effect<
        NearestGeocodingRecord,
        UnexpectedServerError | LocationNotFoundError
      > =>
        geocodingDb
          .nearestPlace({
            ...coordinates,
            maxDistanceMeters: GEOCODE_MAX_DISTANCE_METERS,
          })
          .pipe(Effect.flatMap(orLocationNotFound))

      const querySuggest: GeocodingOperations['querySuggest'] = (request) =>
        Effect.gen(function* (_) {
          const lang = pickLang(request.lang)
          const simPhrase = normalizeName(request.phrase)
          if (simPhrase.length === 0)
            return new GetLocationSuggestionsResponse({result: []})

          const normPhrase = escapeLikePattern(simPhrase)
          // Cascade from cheapest to most expensive: important-places prefix
          // match, full prefix match, and only then typo-tolerant trigram
          // matching (bounded to important places by a partial index).
          const importantMatches = yield* _(
            geocodingDb.suggestPlaces({
              normPhrase,
              simPhrase,
              minImportance: IMPORTANT_ONLY_THRESHOLD,
              usePrefix: true,
              useTrigram: false,
              limit: SUGGEST_LIMIT,
            })
          )

          const prefixMatches =
            importantMatches.length >= SUGGEST_LIMIT || simPhrase.length < 3
              ? importantMatches
              : yield* _(
                  geocodingDb.suggestPlaces({
                    normPhrase,
                    simPhrase,
                    minImportance: 0,
                    usePrefix: true,
                    useTrigram: false,
                    limit: SUGGEST_LIMIT,
                  })
                )

          const matches =
            prefixMatches.length > 0 || simPhrase.length < 4
              ? prefixMatches
              : yield* _(
                  geocodingDb.suggestPlaces({
                    normPhrase,
                    simPhrase,
                    minImportance: 0,
                    usePrefix: false,
                    useTrigram: true,
                    limit: SUGGEST_LIMIT,
                  })
                )

          return yield* _(
            Schema.decodeUnknown(GetLocationSuggestionsResponse)({
              result: pipe(
                matches,
                Array.map((one) => ({userData: suggestionUserData(one, lang)})),
                // A long street can span two dedupe grid cells — drop entries
                // that would render identically AND sit next to each other, so
                // distinct same-named settlements each keep their entry
                Array.dedupeWith(
                  (a, b) =>
                    a.userData.suggestFirstRow === b.userData.suggestFirstRow &&
                    a.userData.suggestSecondRow ===
                      b.userData.suggestSecondRow &&
                    isNearby(a.userData, b.userData)
                )
              ),
            }),
            UnexpectedServerError.wrapErrors('Failed to build suggest response')
          )
        }).pipe(Effect.withSpan('querySuggest'))

      const queryGeocode: GeocodingOperations['queryGeocode'] = (request) =>
        Effect.gen(function* (_) {
          const lang = pickLang(request.lang)
          const place = yield* _(findNearestPlace(request))

          return yield* _(
            Schema.decodeUnknown(GetGeocodedCoordinatesResponse)({
              placeId: buildGeocodePlaceId(
                place.id,
                request.latitude,
                request.longitude
              ),
              address: buildGeocodeAddress(place, lang),
              localizedAddresses: buildLocalizedGeocodeAddresses(
                place,
                SUPPORTED_LANGS
              ),
              // The pin position is the location the user chose — returning it
              // verbatim (instead of the settlement center) keeps meeting
              // location picks exact.
              latitude: request.latitude,
              longitude: request.longitude,
              viewport: buildViewport(
                request.latitude,
                request.longitude,
                place.placeType
              ),
            }),
            UnexpectedServerError.wrapErrors('Failed to build geocode response')
          )
        }).pipe(Effect.withSpan('queryGeocode'))

      const queryLocalizedAddresses: GeocodingOperations['queryLocalizedAddresses'] =
        (request) =>
          Effect.gen(function* (_) {
            const {id, coordinates} = yield* _(
              orLocationNotFound(parsePlaceId(request.placeId))
            )

            const localizedAddresses = yield* _(
              Option.match(coordinates, {
                onSome: (pin) =>
                  Effect.map(findNearestPlace(pin), (place) =>
                    buildLocalizedGeocodeAddresses(place, SUPPORTED_LANGS)
                  ),
                onNone: () =>
                  Effect.map(
                    Effect.flatMap(
                      geocodingDb.placeById(id),
                      orLocationNotFound
                    ),
                    (record) =>
                      buildLocalizedSuggestAddresses(record, SUPPORTED_LANGS)
                  ),
              })
            )

            return yield* _(
              Schema.decodeUnknown(GetLocalizedAddressesResponse)({
                localizedAddresses,
              }),
              UnexpectedServerError.wrapErrors(
                'Failed to build localized addresses response'
              )
            )
          }).pipe(Effect.withSpan('queryLocalizedAddresses'))

      return {querySuggest, queryGeocode, queryLocalizedAddresses}
    })
  )
}
