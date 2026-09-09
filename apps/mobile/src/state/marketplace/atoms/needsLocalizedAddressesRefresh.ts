import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {appLocaleCatalogs} from '@vexl-next/localization/src/translations'
import {Array} from 'effect'

const shippedLanguages = Object.keys(appLocaleCatalogs)

export const needsLocalizedAddressesRefresh = (
  location: OfferLocation
): boolean =>
  Array.isNonEmptyArray(
    Array.difference(
      shippedLanguages,
      Object.keys(location.localizedAddresses ?? {})
    )
  )
