import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {longitudeDeltaToKilometers} from '@vexl-next/domain/src/utility/geoCoordinates'
import {TouchableOpacity} from 'react-native'
import {getTokens, Text, XStack} from 'tamagui'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'

interface Props {
  locations: OfferLocation[] | undefined
  onLocationRemove: (location: OfferLocation) => void
}

function LocationsList({
  locations,
  onLocationRemove,
}: Props): JSX.Element[] | null {
  const {t} = useTranslation()

  return locations
    ? locations?.map((loc) => (
        <XStack
          key={loc.placeId}
          f={1}
          br="$5"
          bc="$darkBrown"
          p="$4"
          ai="center"
          jc="space-between"
          mb="$1"
        >
          <Text
            fos={18}
            color="$main"
            numberOfLines={2}
            ellipsizeMode="tail"
            flexShrink={1}
          >
            {loc.address}
            {' - '}
            {t('map.locationSelect.radius', {
              radius: Intl.NumberFormat(getCurrentLocale()).format(
                Math.round(
                  longitudeDeltaToKilometers(loc.radius, loc.latitude) * 10
                ) / 10
              ),
            })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              onLocationRemove(loc)
            }}
          >
            <SvgImage stroke={getTokens().color.main.val} source={closeSvg} />
          </TouchableOpacity>
        </XStack>
      ))
    : null
}

export default LocationsList
