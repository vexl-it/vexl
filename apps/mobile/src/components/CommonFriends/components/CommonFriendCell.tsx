import {Image, Text, XStack} from 'tamagui'
import SvgImage from '../../Image'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'

interface Props {
  imageUri: UriString | undefined

  name: string
}

function CommonFriendCell({imageUri, name}: Props): JSX.Element {
  return (
    <XStack ai={'center'} mr={'$3'}>
      {imageUri ? (
        <Image br={`$2`} width={30} height={30} source={{uri: imageUri}} />
      ) : (
        <SvgImage
          height={30}
          width={30}
          borderRadius={8}
          source={picturePlaceholderSvg}
        />
      )}
      <Text ml={'$2'} col={'$greyOnBlack'} ff={'$body500'} fos={16}>
        {name}
      </Text>
    </XStack>
  )
}

export default CommonFriendCell
