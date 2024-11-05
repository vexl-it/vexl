import {type OfferLocation} from '@vexl-next/domain/src/general/offers'

export const formatLocationForColumns = (
  location: readonly OfferLocation[]
): string =>
  location
    .map((one) =>
      one.address
        .split(', ')
        .slice(0, 2)
        .map((one) => one.replace(/\d+/g, '').trim())
        .join(', ')
    )
    .join('; ')
