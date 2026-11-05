import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {longitudeDeltaToKilometers} from '@vexl-next/domain/src/utility/geoCoordinates'
import {RowButton, XmarkCancelClose} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {offerLocationLabelsAtom} from '../../../utils/offerLocationLabelsAtom'

interface Props {
  locations: readonly OfferLocation[] | undefined
  onLocationRemove: (location: OfferLocation) => void
}

function LocationsList({
  locations,
  onLocationRemove,
}: Props): React.ReactElement[] | null {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {getFullLabel} = useAtomValue(offerLocationLabelsAtom)

  return locations
    ? pipe(
        locations,
        Array.map((loc) => (
          <RowButton
            key={loc.placeId}
            mb="$1"
            label={`${getFullLabel(loc)} - ${t('map.locationSelect.radius', {
              radius: formatDecimal(
                Math.round(
                  longitudeDeltaToKilometers(loc.radius, loc.latitude) * 10
                ) / 10,
                locale
              ),
            })}`}
            trailingAction={{
              icon: XmarkCancelClose,
              accessibilityLabel: t('common.delete'),
              onPress: () => {
                onLocationRemove(loc)
              },
            }}
          />
        ))
      )
    : null
}

export default LocationsList
