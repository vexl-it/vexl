import {Image, type ImageProps, Stack} from 'tamagui'
import SvgImage from '../Image'
import {type SvgStringOrImageUri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import resolveLocalUri from '../../utils/resolveLocalUri'

interface Props extends Omit<ImageProps, 'src'> {
  avatar: SvgStringOrImageUri
}

function UserAvatar({avatar, ...props}: Props): JSX.Element {
  return avatar.type === 'svgXml' ? (
    <Stack>
      <SvgImage source={avatar.svgXml} />
    </Stack>
  ) : (
    <Image br="$2" src={{uri: resolveLocalUri(avatar.imageUri)}} {...props} />
  )
}

export default UserAvatar
