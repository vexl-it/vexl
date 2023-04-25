import {Stack, Text, XStack, YStack} from 'tamagui'
import React from 'react'

export default function BigIconMessage({
  isLatest,
  smallerText,
  biggerText,
  icon,
}: {
  isLatest: boolean
  smallerText: string
  biggerText?: string
  icon?: React.ReactNode
}): JSX.Element | null {
  return (
    <Stack mb={isLatest ? '$10' : '$4'}>
      <YStack my={'$5'} space={'$4'} alignItems={'center'}>
        {icon && icon}
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
      </YStack>
    </Stack>
  )
}
