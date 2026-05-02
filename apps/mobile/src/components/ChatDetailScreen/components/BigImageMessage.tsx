import {Typography} from '@vexl-next/ui'
import React from 'react'
import {Stack, YStack, type YStackProps} from 'tamagui'

type Props = YStackProps & {
  image?: React.ReactElement
  title?: string
  description?: string
}

export function BigImageMessage({
  image,
  title,
  description,
  ...rest
}: Props): React.ReactElement {
  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      py="$5"
      alignItems="center"
      px="$4"
      gap="$3"
      mx="$4"
    >
      {!!image && <Stack mb="$3">{image}</Stack>}
      {!!title && (
        <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
          {title}
        </Typography>
      )}
      {!!description && (
        <Typography variant="micro" color="$foregroundSecondary">
          {description}
        </Typography>
      )}
    </YStack>
  )
}
