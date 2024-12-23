import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {longitudeDeltaToKilometers} from '@vexl-next/domain/src/utility/geoCoordinates'
import {getCurrentLocale} from '../../utils/localization/I18nProvider'

export const formatLocationForColumns = (
  location: readonly OfferLocation[]
): string =>
  location
    .map(
      (one) =>
        `${one.address
          .split(', ')
          .slice(0, 2)
          .map((one) => one.replace(/\d+/g, '').trim())
          .join(', ')} - ${Intl.NumberFormat(getCurrentLocale()).format(
          Math.round(
            longitudeDeltaToKilometers(one.radius, one.latitude) * 10
          ) / 10
        )} Km`
    )
    .join('; ')
