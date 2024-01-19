import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import Image from '../../Image'
import copySvg from '../images/copySvg'

export default function BigIconMessage({
  isLatest,
  smallerText,
  bottomText,
  biggerText,
  onCopyToClipboardPress,
  icon,
  onPress,
}: {
  isLatest: boolean
  smallerText: string
  biggerText?: string
  bottomText?: string
  onCopyToClipboardPress?: () => void
  icon?: React.ReactNode
  onPress?: () => void
}): JSX.Element | null {
  return (
    <Stack mb={isLatest ? '$10' : '$4'}>
      <YStack my="$5" space="$4" alignItems="center">
        {icon && icon}
        <YStack>
          <XStack alignItems="center">
            <Stack flex={1} height={1} bc="$grey" />
            <Text
              textAlign="center"
              mx="$5"
              color="$greyOnBlack"
              fontSize={14}
              fontFamily="$body500"
            >
              {smallerText}
            </Text>
            <Stack flex={1} height={1} bc="$grey" />
          </XStack>
          {biggerText && (
            <XStack ai="center" jc="center" space="$1">
              <TouchableOpacity disabled={!onPress} onPress={onPress}>
                <Text
                  mx="$4"
                  textAlign="center"
                  color="$white"
                  fos={20}
                  ff="$body500"
                >
                  {biggerText}
                </Text>
              </TouchableOpacity>
              {onCopyToClipboardPress && (
                <TouchableOpacity onPress={onCopyToClipboardPress}>
                  <Image fill={getTokens().color.white.val} source={copySvg} />
                </TouchableOpacity>
              )}
            </XStack>
          )}
          {bottomText && (
            <Text
              textAlign="center"
              mx="$5"
              color="$greyOnBlack"
              fontSize={14}
              fontFamily="$body500"
            >
              {bottomText}
            </Text>
          )}
        </YStack>
      </YStack>
    </Stack>
  )
}
