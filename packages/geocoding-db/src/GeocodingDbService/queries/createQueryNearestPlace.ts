import {type SqlError, SqlSchema, type Statement} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, Option, type ParseResult, Schema} from 'effect'
import {
  BOUNDARY_MATCH_TOLERANCE_DEG,
  boundaryPlaceType,
  type BoundaryRole,
  CITY_TYPES,
  computeImportance,
  isCityType,
  SETTLEMENT_TYPE_WEIGHTS,
  SUB_CITY_TYPES,
} from '../../common'
import {
  GeocodingRecord,
  GeocodingRecordId,
  GeocodingTranslations,
} from '../domain'
import {
  BoundaryCandidate,
  resolveBoundaryCandidates,
} from '../resolveBoundaryCandidates'

/** A sub-city label gets "…, City" from a city/town node within this. */
const CITY_CONTEXT_MAX_DISTANCE_METERS = 30_000
/**
 * Context candidates are scored by importance minus this per km, so London
 * (8.9M, 5 km) beats the place=city node of Westminster (4 km) for Brixton,
 * while Taipei (2.7M, 2 km) still beats New Taipei (4M, 8 km) and a village
 * next to Kladno reads "…, Kladno", not "…, Praha" 25 km away.
 */
const CITY_CONTEXT_DISTANCE_PENALTY_PER_KM = 0.005
/**
 * When a city polygon covers the pin but no sub-city polygon does (most of
 * the world maps neighbourhoods as nodes only), the nearest sub-city node
 * inside that city within this distance is the label.
 */
const SUB_CITY_NODE_MAX_DISTANCE_METERS = 1_500

const NearestPlaceRequest = Schema.Struct({
  latitude: Schema.Number,
  longitude: Schema.Number,
  /** Results farther than this are treated as "no place here" (ocean pins). */
  maxDistanceMeters: Schema.Number,
})

export class NearestGeocodingRecord extends Schema.Class<NearestGeocodingRecord>(
  'NearestGeocodingRecord'
)({
  ...GeocodingRecord.fields,
  distanceMeters: Schema.Number,
  cityName: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
  cityNames: Schema.optionalWith(GeocodingTranslations, {
    as: 'Option',
    nullable: true,
  }),
}) {}

class NearestSettlement extends Schema.Class<NearestSettlement>(
  'NearestSettlement'
)({
  ...GeocodingRecord.fields,
  distanceMeters: Schema.Number,
}) {}

class CityContext extends Schema.Class<CityContext>('CityContext')({
  name: Schema.String,
  names: GeocodingTranslations,
  countryCode: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
}) {}

export const createQueryNearestPlace = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const queryPoint = (
    latitude: number,
    longitude: number
  ): Statement.Fragment => sql`
    ST_SetSRID (
      ST_MakePoint (
        ${longitude},
        ${latitude}
      ),
      4326
    )
  `

  const queryBoundaryCandidates = SqlSchema.findAll({
    Request: Schema.Struct({latitude: Schema.Number, longitude: Schema.Number}),
    Result: BoundaryCandidate,
    execute: (params) => sql`
      SELECT
        b.id,
        b.name,
        b.names,
        b.country_code,
        b.boundary_type,
        b.admin_level,
        b.place_tag,
        b.area_meters,
        min(
          ST_Distance (g.geometry, ${queryPoint(
        params.latitude,
        params.longitude
      )})
        ) AS distance_deg
      FROM
        place_boundary_geometries g
        JOIN place_boundaries b ON b.id = g.boundary_id
      WHERE
        ST_DWithin (
          g.geometry,
          ${queryPoint(params.latitude, params.longitude)},
          ${BOUNDARY_MATCH_TOLERANCE_DEG}
        )
      GROUP BY
        b.id
    `,
  })

  /**
   * The "…, City" context: the best city/town node within 30 km by
   * importance and distance, preferring the label's own country (an Austrian
   * village next to Bratislava keeps an Austrian town).
   */
  const queryCityContext = SqlSchema.findOne({
    Request: Schema.Struct({
      latitude: Schema.Number,
      longitude: Schema.Number,
      countryCode: Schema.NullOr(Schema.String),
    }),
    Result: CityContext,
    execute: (params) => sql`
      SELECT
        candidates.name,
        candidates.names,
        candidates.country_code
      FROM
        (
          SELECT
            city.name,
            city.names,
            city.country_code,
            city.importance,
            earth_distance (
              ll_to_earth (
                ${params.latitude},
                ${params.longitude}
              ),
              ll_to_earth (city.latitude, city.longitude)
            ) AS city_distance
          FROM
            places city
          WHERE
            ${sql.in('city.place_type', CITY_TYPES)}
          ORDER BY
            ll_to_earth (city.latitude, city.longitude) <-> ll_to_earth (
              ${params.latitude},
              ${params.longitude}
            )
          LIMIT
            24
        ) candidates
      WHERE
        candidates.city_distance <= ${CITY_CONTEXT_MAX_DISTANCE_METERS}
      ORDER BY
        (
          ${params.countryCode}::text IS NULL
          OR candidates.country_code = ${params.countryCode}::text
        ) DESC,
        candidates.importance - candidates.city_distance / 1000 * ${CITY_CONTEXT_DISTANCE_PENALTY_PER_KM} DESC,
        candidates.city_distance ASC
      LIMIT
        1
    `,
  })

  const queryNearestSubCityNodeInBoundary = SqlSchema.findOne({
    Request: Schema.Struct({
      boundaryId: GeocodingRecordId,
      latitude: Schema.Number,
      longitude: Schema.Number,
    }),
    Result: NearestSettlement,
    execute: (params) => sql`
      SELECT
        p.*,
        earth_distance (
          ll_to_earth (
            ${params.latitude},
            ${params.longitude}
          ),
          ll_to_earth (p.latitude, p.longitude)
        ) AS distance_meters
      FROM
        places p
      WHERE
        ${sql.in('p.place_type', SUB_CITY_TYPES)}
        AND earth_box (
          ll_to_earth (
            ${params.latitude},
            ${params.longitude}
          ),
          ${SUB_CITY_NODE_MAX_DISTANCE_METERS}
        ) @> ll_to_earth (p.latitude, p.longitude)
        AND earth_distance (
          ll_to_earth (
            ${params.latitude},
            ${params.longitude}
          ),
          ll_to_earth (p.latitude, p.longitude)
        ) <= ${SUB_CITY_NODE_MAX_DISTANCE_METERS}
        AND EXISTS (
          SELECT
            1
          FROM
            place_boundary_geometries g
          WHERE
            g.boundary_id = ${params.boundaryId}
            AND ST_Covers (
              g.geometry,
              ST_SetSRID (ST_MakePoint (p.longitude, p.latitude), 4326)
            )
        )
      ORDER BY
        ll_to_earth (p.latitude, p.longitude) <-> ll_to_earth (
          ${params.latitude},
          ${params.longitude}
        )
      LIMIT
        1
    `,
  })

  const queryNearestSettlement = SqlSchema.findOne({
    Request: NearestPlaceRequest,
    Result: NearestSettlement,
    execute: (params) => sql`
      SELECT
        *
      FROM
        (
          SELECT
            p.*,
            earth_distance (
              ll_to_earth (
                ${params.latitude},
                ${params.longitude}
              ),
              ll_to_earth (p.latitude, p.longitude)
            ) AS distance_meters
          FROM
            places p
          WHERE
            -- Reverse geocoding resolves to settlements only — a dropped pin
            -- should read "Vinohrady, Praha", never a street or café name.
            -- Keep in sync with "places_settlement_earth_IX" (migration 0001).
            ${sql.in('p.place_type', Object.keys(SETTLEMENT_TYPE_WEIGHTS))}
          ORDER BY
            ll_to_earth (p.latitude, p.longitude) <-> ll_to_earth (
              ${params.latitude},
              ${params.longitude}
            )
          LIMIT
            1
        ) nearest
      WHERE
        nearest.distance_meters <= ${params.maxDistanceMeters}
    `,
  })

  const withContext = (
    settlement: NearestSettlement,
    context: Option.Option<CityContext>
  ): NearestGeocodingRecord =>
    new NearestGeocodingRecord({
      ...settlement,
      countryCode: Option.orElse(settlement.countryCode, () =>
        Option.flatMap(context, (one) => one.countryCode)
      ),
      cityName: Option.map(context, (one) => one.name),
      cityNames: Option.map(context, (one) => one.names),
    })

  const boundaryAsSettlement = (
    boundary: BoundaryCandidate,
    role: BoundaryRole,
    countryCode: Option.Option<string>,
    latitude: number,
    longitude: number
  ): NearestSettlement => {
    const placeType = boundaryPlaceType(role, boundary.placeTag)
    return new NearestSettlement({
      id: boundary.id,
      placeType,
      name: boundary.name,
      names: boundary.names,
      countryCode: Option.orElse(countryCode, () =>
        Option.fromNullable(boundary.countryCode)
      ),
      population: Option.none(),
      importance: computeImportance(placeType, undefined),
      latitude,
      longitude,
      distanceMeters: 0,
    })
  }

  const boundaryAsContext = (boundary: BoundaryCandidate): CityContext =>
    new CityContext({
      name: boundary.name,
      names: boundary.names,
      countryCode: Option.fromNullable(boundary.countryCode),
    })

  /**
   * A covering city/town boundary is the context; a municipality boundary
   * can be a single village, so the best city/town node stands in.
   */
  const contextInside = (
    city: Option.Option<BoundaryCandidate>,
    label: NearestSettlement
  ): Effect.Effect<
    Option.Option<CityContext>,
    SqlError.SqlError | ParseResult.ParseError
  > =>
    Option.isSome(city) &&
    isCityType(boundaryPlaceType('city', city.value.placeTag))
      ? Effect.succeed(Option.some(boundaryAsContext(city.value)))
      : queryCityContext({
          latitude: label.latitude,
          longitude: label.longitude,
          countryCode: Option.getOrNull(label.countryCode),
        })

  const query = (
    params: typeof NearestPlaceRequest.Type
  ): Effect.Effect<
    Option.Option<NearestGeocodingRecord>,
    UnexpectedServerError
  > =>
    Effect.gen(function* (_) {
      const {latitude, longitude} = params
      const {subCity, city, countryCode} = resolveBoundaryCandidates(
        yield* _(queryBoundaryCandidates({latitude, longitude}))
      )

      if (Option.isSome(subCity)) {
        const label = boundaryAsSettlement(
          subCity.value,
          'subCity',
          countryCode,
          latitude,
          longitude
        )
        return Option.some(
          withContext(label, yield* _(contextInside(city, label)))
        )
      }

      if (Option.isSome(city)) {
        const node = yield* _(
          queryNearestSubCityNodeInBoundary({
            boundaryId: city.value.id,
            latitude,
            longitude,
          })
        )
        if (Option.isSome(node)) {
          const label = new NearestSettlement({
            ...node.value,
            countryCode: Option.orElse(
              countryCode,
              () => node.value.countryCode
            ),
          })
          return Option.some(
            withContext(label, yield* _(contextInside(city, label)))
          )
        }
        const label = boundaryAsSettlement(
          city.value,
          'city',
          countryCode,
          latitude,
          longitude
        )
        return Option.some(
          withContext(
            label,
            isCityType(label.placeType)
              ? Option.none()
              : yield* _(contextInside(Option.none(), label))
          )
        )
      }

      const nearest = yield* _(queryNearestSettlement(params))
      if (Option.isNone(nearest)) return Option.none()
      return Option.some(
        withContext(
          nearest.value,
          isCityType(nearest.value.placeType)
            ? Option.none()
            : yield* _(contextInside(Option.none(), nearest.value))
        )
      )
    }).pipe(
      UnexpectedServerError.wrapErrors(
        'Geocoding DB nearestPlace query failed'
      ),
      Effect.withSpan('queryNearestPlace query')
    )

  return query
})
