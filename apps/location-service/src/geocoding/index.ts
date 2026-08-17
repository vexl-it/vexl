import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {GeocodingDbService} from '@vexl-next/geocoding-db/src/GeocodingDbService'
import {type GeocodingRecordWithContext} from '@vexl-next/geocoding-db/src/GeocodingDbService/domain'
import {normalizeName} from '@vexl-next/geocoding-db/src/common'
import {
  GetGeocodedCoordinatesResponse,
  GetLocationSuggestionsResponse,
  LocationNotFoundError,
  type GetGeocodedCoordinatesRequest,
  type GetLocationSuggestionsRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {Array, Context, Effect, Layer, Option, pipe, Schema} from 'effect'
import {
  buildGeocodeAddress,
  buildSuggestSecondRow,
  buildViewport,
  escapeLikePattern,
  localizedName,
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
 * packages/geocoding-db/scripts/ingest.ts).
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
}

interface SuggestionUserData {
  placeId: string
  suggestFirstRow: string
  suggestSecondRow: string
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
  placeId: `osm:${record.id}`,
  suggestFirstRow: localizedName(record.name, record.names, lang),
  suggestSecondRow: buildSuggestSecondRow(record, lang),
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
            Effect.catchTag('ParseError', (e) =>
              Effect.zipRight(
                Effect.logError('Error decoding suggest response', e),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            ),
            Effect.catchAllDefect((defect) =>
              Effect.zipRight(
                Effect.logError(
                  'Defect while building suggest response',
                  defect
                ),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            )
          )
        })

      const queryGeocode: GeocodingOperations['queryGeocode'] = (request) =>
        Effect.gen(function* (_) {
          const lang = pickLang(request.lang)

          const nearest = yield* _(
            geocodingDb.nearestPlace({
              latitude: request.latitude,
              longitude: request.longitude,
              maxDistanceMeters: GEOCODE_MAX_DISTANCE_METERS,
            })
          )

          if (Option.isNone(nearest))
            return yield* _(
              Effect.fail(new LocationNotFoundError({status: 404}))
            )
          const place = nearest.value

          return yield* _(
            Schema.decodeUnknown(GetGeocodedCoordinatesResponse)({
              // placeId carries the pin coordinates so two different pins in
              // the same settlement stay distinct entries on the client.
              placeId: `osm:${place.id}@${request.latitude.toFixed(4)},${request.longitude.toFixed(4)}`,
              address: buildGeocodeAddress(place, lang),
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
            Effect.catchTag('ParseError', (e) =>
              Effect.zipRight(
                Effect.logError('Error decoding geocode response', e),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            ),
            Effect.catchAllDefect((defect) =>
              Effect.zipRight(
                Effect.logError(
                  'Defect while building geocode response',
                  defect
                ),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            )
          )
        })

      return {querySuggest, queryGeocode}
    })
  )
}
