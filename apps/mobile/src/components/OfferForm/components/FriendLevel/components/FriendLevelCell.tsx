import {type IntendedConnectionLevel} from '@vexl-next/domain/src/general/offers'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {Avatar, Loader, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, XStack} from 'tamagui'
import {userDataRealOrAnonymizedAtom} from '../../../../../state/session/userDataAtoms'
import resolveLocalUri from '../../../../../utils/resolveLocalUri'
import SvgImage from '../../../../Image'
import checkmarkInCircleSvg from '../../../../images/checkmarkInCircleSvg'

interface FriendLevelCellContentProps {
  loading?: boolean
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
  loading,
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
              {userData.image.type === 'imageUri' ? (
                <Avatar
                  customSize={type === 'FIRST' ? 50 : 25}
                  source={{uri: resolveLocalUri(userData.image.imageUri)}}
                />
              ) : (
                <Avatar customSize={type === 'FIRST' ? 50 : 25}>
                  <SvgImage source={userData.image.svgXml} />
                </Avatar>
              )}
            </Stack>
          </Stack>
          <Typography
            variant="paragraphDemibold"
            marginTop="$2"
            marginBottom="$1"
            color={selected ? '$main' : '$greyOnBlack'}
          >
            {title}
          </Typography>
          <XStack ai="center" gap="$2">
            {!!loading && <Loader size="small" />}
            <Typography
              variant="description"
              textAlign="center"
              color={selected ? '$main' : '$greyOnBlack'}
            >
              {subtitle}
            </Typography>
          </XStack>
        </Stack>
      </TouchableOpacity>
    </Stack>
  )
}

export default FriendLevelCell
