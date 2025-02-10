import {type OfferLocation} from '@vexl-next/domain/src/general/offers'

export const formatLocationForColumns = (
  location: readonly OfferLocation[]
): string => location.map((one) => `${one.address}`).join('; ')
