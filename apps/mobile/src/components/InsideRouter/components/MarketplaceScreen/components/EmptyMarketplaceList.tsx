import {Button, Typography} from '@vexl-next/ui'
import React from 'react'
import {Stack} from 'tamagui'

interface EmptyMarketplaceListProps {
  readonly title: string
  readonly description: string
  readonly buttonLabel: string
  readonly onButtonPress: () => void
}

function EmptyMarketplaceList({
  title,
  description,
  buttonLabel,
  onButtonPress,
}: EmptyMarketplaceListProps): React.ReactElement {
  return (
    <Stack paddingTop="$10" paddingHorizontal="$5" gap="$7">
      <Typography
        variant="heading3"
        color="$foregroundPrimary"
        textAlign="center"
      >
        {title}
      </Typography>
      <Typography
        variant="description"
        color="$foregroundSecondary"
        textAlign="center"
      >
        {description}
      </Typography>
      <Button variant="tertiary" size="small" onPress={onButtonPress}>
        {buttonLabel}
      </Button>
    </Stack>
  )
}

export default EmptyMarketplaceList
