import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {longitudeDeltaToKilometers} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Typography, useTheme, XmarkCancelClose, XStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'

interface Props {
  locations: readonly OfferLocation[] | undefined
  onLocationRemove: (location: OfferLocation) => void
}

function LocationsList({
  locations,
  onLocationRemove,
}: Props): React.ReactElement[] | null {
  const {t} = useTranslation()
  const theme = useTheme()
  const locale = useAtomValue(formattingLocaleAtom)

  return locations
    ? pipe(
        locations,
        Array.map((loc) => (
          <XStack
            key={loc.placeId}
            f={1}
            br="$3"
            bc="$backgroundSecondary"
            p="$4"
            ai="center"
            jc="space-between"
            gap="$3"
            mb="$1"
          >
            <Typography
              variant="paragraph"
              color="$foregroundPrimary"
              numberOfLines={2}
              ellipsizeMode="tail"
              flexShrink={1}
            >
              {loc.address}
              {' - '}
              {t('map.locationSelect.radius', {
                radius: formatDecimal(
                  Math.round(
                    longitudeDeltaToKilometers(loc.radius, loc.latitude) * 10
                  ) / 10,
                  locale
                ),
              })}
            </Typography>
            <TouchableOpacity
              onPress={() => {
                onLocationRemove(loc)
              }}
            >
              <XmarkCancelClose
                size={24}
                color={theme.foregroundPrimary.get()}
              />
            </TouchableOpacity>
          </XStack>
        ))
      )
    : null
}

export default LocationsList
