import {type StyleProp, type ViewStyle} from 'react-native'
import SvgImage from '../../../../Image'
import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {Image, Stack, Text} from 'tamagui'
import resolveLocalUri from '../../../../../utils/resolveLocalUri'

interface Props {
  topText?: string
  userNameAndAvatar: UserNameAndAvatar

  style?: StyleProp<ViewStyle>
}

function UserDataDisplay({
  topText,
  userNameAndAvatar,
  style,
}: Props): JSX.Element {
  return (
    <Stack ai="center" jc="center" style={style}>
      {topText && (
        <Stack mb="$6">
          <Text fos={18} ff="$body600" color="$white">
            {topText}
          </Text>
        </Stack>
      )}
      {userNameAndAvatar.image.type === 'svgXml' ? (
        <Stack w={128} h={128} mb="$7">
          <SvgImage source={userNameAndAvatar.image.svgXml} />
        </Stack>
      ) : (
        <Image
          width={128}
          height={128}
          br="$10"
          mb="$7"
          source={{uri: resolveLocalUri(userNameAndAvatar.image.imageUri)}}
        />
      )}
      <Text ff="$heading" fos={32} col="$white">
        {userNameAndAvatar.userName}
      </Text>
    </Stack>
  )
}

export default UserDataDisplay
