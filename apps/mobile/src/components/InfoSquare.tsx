import React from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import infoSvg from './ChatDetailScreen/images/infoSvg'
import Image from './Image'

function InfoSquare({
  children,
  negative,
  onPress,
}: {
  children: string
  negative?: boolean
  onPress?: () => void
}): React.ReactElement {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <XStack
        bc={negative ? '$darkRed' : '$grey'}
        p="$3"
        br="$true"
        alignItems="center"
      >
        <Stack w={16} h={16} mr="$3">
          <Image
            fill={
              negative
                ? getTokens().color.$red.val
                : getTokens().color.$greyOnBlack.val
            }
            source={infoSvg}
          />
        </Stack>
        <Text flex={1} color={negative ? '$red' : '$white'}>
          {children}
        </Text>
      </XStack>
    </TouchableWithoutFeedback>
  )
}

export default InfoSquare
