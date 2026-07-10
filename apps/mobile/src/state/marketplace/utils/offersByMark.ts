import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, Order, pipe} from 'effect'
import {DateTime} from 'luxon'

function markedAtMillis(offer: OneOfferInState): number {
  const markedAt = offer.flags.mark?.markedAt
  return markedAt !== undefined ? DateTime.fromISO(markedAt).toMillis() : 0
}

// isoNow() emits local-offset ISO strings which are not lexicographically
// chronological across offsets, so compare parsed milliseconds
const byMarkedAtNewestFirst = Order.mapInput(
  Order.reverse(Order.number),
  markedAtMillis
)

export function groupOffersByMark<T extends OneOfferInState>(
  offers: readonly T[]
): {
  favourites: T[]
  browse: T[]
  archived: T[]
} {
  return {
    favourites: pipe(
      offers,
      Array.filter((one) => one.flags.mark?.type === 'FAVOURITE'),
      Array.sort(byMarkedAtNewestFirst)
    ),
    browse: pipe(
      offers,
      Array.filter((one) => one.flags.mark === undefined)
    ),
    archived: pipe(
      offers,
      Array.filter((one) => one.flags.mark?.type === 'ARCHIVED'),
      Array.sort(byMarkedAtNewestFirst)
    ),
  }
}
