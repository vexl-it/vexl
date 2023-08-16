import {Stack, Text, XStack, YStack} from 'tamagui'
import React from 'react'
import {TouchableOpacity} from 'react-native'

export default function BigIconMessage({
  isLatest,
  smallerText,
  bottomText,
  biggerText,
  icon,
  onTextPress,
}: {
  isLatest: boolean
  smallerText: string
  biggerText?: string
  bottomText?: string
  icon?: React.ReactNode
  onTextPress?: () => void
}): JSX.Element | null {
  return (
    <Stack mb={isLatest ? '$10' : '$4'}>
      <YStack my={'$5'} space={'$4'} alignItems={'center'}>
        {icon && icon}
        <TouchableOpacity disabled={!onTextPress} onPress={onTextPress}>
          <YStack>
            <XStack alignItems={'center'}>
              <Stack flex={1} height={1} bc={'$grey'} />
              <Text
                textAlign="center"
                mx={'$5'}
                color="$greyOnBlack"
                fontSize={14}
                fontFamily="$body500"
              >
                {smallerText}
              </Text>
              <Stack flex={1} height={1} bc={'$grey'} />
            </XStack>
            {biggerText && (
              <Text
                mx={'$4'}
                textAlign="center"
                color="$white"
                fos={20}
                ff={'$body500'}
              >
                {biggerText}
              </Text>
            )}
            {bottomText && (
              <Text
                textAlign="center"
                mx={'$5'}
                color="$greyOnBlack"
                fontSize={14}
                fontFamily="$body500"
              >
                {bottomText}
              </Text>
            )}
          </YStack>
        </TouchableOpacity>
      </YStack>
    </Stack>
  )
}
