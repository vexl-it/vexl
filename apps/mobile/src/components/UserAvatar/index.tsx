import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Image, Stack, type ImageProps} from 'tamagui'
import resolveLocalUri from '../../utils/resolveLocalUri'
import SvgImage from '../Image'

interface Props extends Omit<ImageProps, 'src'> {
  avatar: SvgStringOrImageUri
}

function UserAvatar({avatar, ...props}: Props): JSX.Element {
  return avatar.type === 'svgXml' ? (
    <Stack>
      <SvgImage source={avatar.svgXml} />
    </Stack>
  ) : (
    <Image
      {...props}
      br="$2"
      source={{uri: resolveLocalUri(avatar.imageUri)}}
    />
  )
}

export default UserAvatar
