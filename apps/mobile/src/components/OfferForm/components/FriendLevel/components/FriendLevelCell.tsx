import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text} from 'tamagui'
import {userDataRealOrAnonymizedAtom} from '../../../../../state/session/userDataAtoms'
import SvgImage from '../../../../Image'
import checkmarkInCircleSvg from '../../../../images/checkmarkInCircleSvg'
import UserAvatar from '../../../../UserAvatar'

interface FriendLevelCellContentProps {
  image: SvgString
  title: string
  subtitle?: string
  type: IntendedConnectionLevel
}

interface Props extends FriendLevelCellContentProps {
  selected: boolean
  onPress: (_: IntendedConnectionLevel) => void
}

function FriendLevelCell({
  image,
  onPress,
  selected,
  subtitle,
  title,
  type,
}: Props): React.ReactElement {
  const userData = useAtomValue(userDataRealOrAnonymizedAtom)
  return (
    <Stack f={1}>
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
            <Stack pos="absolute" left={8} top={8}>
              {selected ? (
                <SvgImage source={checkmarkInCircleSvg} />
              ) : (
                <Stack w={16} h={16} br={8} bw={1} borderColor="$greyAccent2" />
              )}
            </Stack>
            <SvgImage source={image} />
            <Stack pos="absolute" zi={100} top={16}>
              <UserAvatar
                height={type === 'FIRST' ? 50 : 25}
                width={type === 'FIRST' ? 50 : 25}
                userImage={userData.image}
              />
            </Stack>
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
          <Text
            textAlign="center"
            col={selected ? '$main' : '$greyOnBlack'}
            ff="$body500"
            fos={14}
          >
            {subtitle}
          </Text>
        </Stack>
      </TouchableOpacity>
    </Stack>
  )
}

export default FriendLevelCell
