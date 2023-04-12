import {Stack, Text} from 'tamagui'
import SvgImage from '../../../../Image'
import checkmarkSvg from '../images/checkmarkSvg'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {TouchableOpacity} from 'react-native'
import {useSessionAssumeLoggedIn} from '../../../../../state/session'
import UserAvatar from './UserAvatar'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'

interface FriendLevelCellContentProps {
  image: SvgString
  title: string
  subtitle: string
  type: ConnectionLevel
}
interface Props extends FriendLevelCellContentProps {
  selected: boolean
  onPress: (_: ConnectionLevel) => void
}

function FriendLevelCell({
  image,
  onPress,
  selected,
  subtitle,
  title,
  type,
}: Props): JSX.Element {
  const session = useSessionAssumeLoggedIn()
  return (
    <TouchableOpacity
      onPress={() => {
        onPress(type)
      }}
    >
      <Stack ai="center">
        <Stack
          bc={selected ? '$darkBrown' : '$grey'}
          pos="relative"
          ai="center"
          jc="center"
          p="$4"
          br="$5"
        >
          {selected && (
            <Stack pos="absolute" left={8} top={8}>
              <SvgImage source={checkmarkSvg} />
            </Stack>
          )}
          <UserAvatar
            pos="absolute"
            top={16}
            height={type === 'FIRST' ? 50 : 25}
            width={type === 'FIRST' ? 50 : 25}
            avatar={session.realUserData.image}
          />
          <SvgImage source={image} />
        </Stack>
        <Text
          mt="$2"
          mb="$1"
          col={selected ? '$main' : '$greyOnBlack'}
          ff="$body600"
          fos={18}
        >
          {title}
        </Text>
        <Text col={selected ? '$main' : '$greyOnBlack'} ff="$body500" fos={14}>
          {subtitle}
        </Text>
      </Stack>
    </TouchableOpacity>
  )
}

export default FriendLevelCell
