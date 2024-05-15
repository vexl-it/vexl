import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {getTokens, Image, Text, XStack} from 'tamagui'
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
          height={20}
          width={20}
          borderRadius={8}
          source={picturePlaceholderSvg}
          fill={getTokens().color.greyOnWhite.val}
        />
      )}
      <Text
        ml="$2"
        col={variant === 'light' ? '$greyOnWhite' : '$white'}
        ff="$body500"
        fos={12}
      >
        {name}
      </Text>
    </XStack>
  )
}

export default CommonFriendCell
