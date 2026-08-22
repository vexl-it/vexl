import {Array, Option, Order, pipe, Schema} from 'effect'
import {boundaryRole, type BoundaryRole} from '../common'
import {GeocodingRecordId, GeocodingTranslations} from './domain'

/** A boundary within match tolerance of the pin, as returned by the DB. */
export class BoundaryCandidate extends Schema.Class<BoundaryCandidate>(
  'BoundaryCandidate'
)({
  id: GeocodingRecordId,
  name: Schema.String,
  names: GeocodingTranslations,
  countryCode: Schema.NullOr(Schema.String),
  boundaryType: Schema.String,
  adminLevel: Schema.NullOr(Schema.Number),
  placeTag: Schema.NullOr(Schema.String),
  areaMeters: Schema.Number,
  /** 0 when the boundary covers the pin, otherwise the gap (sliver) size. */
  distanceDeg: Schema.Number,
}) {}

export interface ResolvedBoundaries {
  /** First part of the label ("Holešovice"). */
  subCity: Option.Option<BoundaryCandidate>
  /** "…, City" context, and the label itself when there is no sub-city. */
  city: Option.Option<BoundaryCandidate>
  /**
   * Country of the largest covering boundary (any role). Nested boundaries
   * share a country, and a district hugging a river border can have its
   * ingest-time country lookup land across the border — the county or
   * municipality around it never does.
   */
  countryCode: Option.Option<string>
}

/**
 * Covering boundaries first, then the smallest one: a cadastral area inside
 * a borough inside a city resolves to the cadastral area.
 */
const bySpecificity = Order.combineAll<BoundaryCandidate>([
  Order.mapInput(Order.number, (one) => one.distanceDeg),
  Order.mapInput(Order.number, (one) => one.areaMeters),
  Order.mapInput(Order.bigint, (one) => one.id),
])

const mostSpecificWithRole = (
  candidates: readonly BoundaryCandidate[],
  role: BoundaryRole
): Option.Option<BoundaryCandidate> =>
  pipe(
    candidates,
    Array.filter((one) => boundaryRole(one) === role),
    Array.sort(bySpecificity),
    Array.head
  )

const countryOfLargestCovering = (
  candidates: readonly BoundaryCandidate[]
): Option.Option<string> =>
  pipe(
    candidates,
    Array.filter((one) => one.distanceDeg === 0 && one.countryCode !== null),
    Array.sort(
      Order.mapInput(
        Order.reverse(Order.number),
        (one: BoundaryCandidate) => one.areaMeters
      )
    ),
    Array.head,
    Option.flatMap((one) => Option.fromNullable(one.countryCode))
  )

export const resolveBoundaryCandidates = (
  candidates: readonly BoundaryCandidate[]
): ResolvedBoundaries => ({
  subCity: mostSpecificWithRole(candidates, 'subCity'),
  city: mostSpecificWithRole(candidates, 'city'),
  countryCode: countryOfLargestCovering(candidates),
})
