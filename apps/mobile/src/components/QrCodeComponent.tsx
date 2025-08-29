import React from 'react'
import {type ImageSourcePropType} from 'react-native'
import {Stack, Text, YStack} from 'tamagui'
import {SharableQrCode} from './SharableQrCode'

export function QrCodeComponent({
  link,
  logo,
  heading,
  text,
}: {
  link: string
  logo?: string | ImageSourcePropType | undefined
  heading: string
  text: string
}): React.ReactElement {
  return (
    <YStack gap="$4" my="$4">
      <Stack alignContent="center" alignItems="center" mb="$2">
        <SharableQrCode size={300} value={link} logo={logo} />
      </Stack>
      <Text color="black" ff="$heading" fontSize={32}>
        {heading}
      </Text>
      <Text color="$greyOnWhite" ff="$body500" fontSize={18}>
        {text}
      </Text>
    </YStack>
  )
}
