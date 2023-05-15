import {Stack, Text, XStack} from 'tamagui'
import SvgImage from '../../../Image'
import locationSvg from '../../../images/locationSvg'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'

interface Props extends TouchableOpacityProps {
  city: string
  country: string
}

function LocationCell({city, country, ...props}: Props): JSX.Element {
  return (
    <TouchableOpacity {...props}>
      <XStack ai="flex-start" pt="$4">
        <SvgImage source={locationSvg} />
        <Stack f={1} ml="$4" bbw={1} bbc="$grey" pb="$4">
          <Text pb="$1" col="$white" fos={18} ff="$body400">
            {city}
          </Text>
          <Text col="$greyOnBlack" fos={14} ff="$body400">
            {country}
          </Text>
        </Stack>
      </XStack>
    </TouchableOpacity>
  )
}

export default LocationCell
