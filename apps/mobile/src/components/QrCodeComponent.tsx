import {Stack, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {type ImageSourcePropType} from 'react-native'
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
      <Typography variant="heading2" color="$foregroundPrimary">
        {heading}
      </Typography>
      <Typography variant="paragraph" color="$foregroundSecondary">
        {text}
      </Typography>
    </YStack>
  )
}
