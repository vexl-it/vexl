import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Image, Text, XStack} from 'tamagui'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'

interface Props {
  imageUri: UriString | undefined
  name: string
  variant: 'light' | 'dark'
}

function CommonFriendCell({imageUri, name, variant}: Props): JSX.Element {
  return (
    <XStack ai="center" mr="$3">
      {imageUri ? (
        <Image br="$2" width={30} height={30} source={{uri: imageUri}} />
      ) : (
        <SvgImage
          height={30}
          width={30}
          borderRadius={8}
          source={picturePlaceholderSvg}
        />
      )}
      <Text ml="$2" col={variant === 'light' ? '$black' : '$white'} fos={16}>
        {name}
      </Text>
    </XStack>
  )
}

export default CommonFriendCell
