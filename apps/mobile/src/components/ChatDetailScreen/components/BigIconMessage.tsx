import React from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import Button from '../../Button'
import Image from '../../Image'
import copySvg from '../images/copySvg'

interface Props {
  isLatest: boolean
  smallerText: string
  biggerText?: string
  bottomText?: string
  onCopyToClipboardPress?: () => void
  icon?: React.ReactNode
  buttonText?: string | undefined
  onButtonPress?: () => void
}

export default function BigIconMessage({
  isLatest,
  smallerText,
  bottomText,
  biggerText,
  onCopyToClipboardPress,
  icon,
  buttonText,
  onButtonPress,
}: Props): JSX.Element | null {
  return (
    <Stack mb={isLatest ? '$10' : '$4'}>
      <YStack my="$5" gap="$4" alignItems="center">
        {!!icon && icon}
        <YStack ai="center">
          <XStack alignItems="center" gap="$2">
            <Stack w={40} height={1} bc="$grey" />
            <Text
              textAlign="center"
              color="$greyOnBlack"
              fontSize={14}
              fontFamily="$body500"
              numberOfLines={2}
            >
              {smallerText}
            </Text>
            <Stack w={40} height={1} bc="$grey" />
          </XStack>
          {!!biggerText && (
            <XStack ai="center" jc="center" gap="$1">
              <Text
                mx="$4"
                textAlign="center"
                color="$white"
                fos={20}
                ff="$body500"
              >
                {biggerText}
              </Text>
              {!!onCopyToClipboardPress && (
                <TouchableOpacity onPress={onCopyToClipboardPress}>
                  <Image fill={getTokens().color.white.val} source={copySvg} />
                </TouchableOpacity>
              )}
            </XStack>
          )}
          {!!bottomText && (
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
          {!!buttonText && !!onButtonPress && (
            <Stack mt="$2">
              <Button
                text={buttonText}
                onPress={onButtonPress}
                variant="secondary"
                size="small"
              />
            </Stack>
          )}
        </YStack>
      </YStack>
    </Stack>
  )
}
