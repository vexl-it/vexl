import React from 'react'
import {useThemeName} from 'tamagui'

import {
  marketplaceIntroDialogGraphicDark,
  marketplaceIntroDialogGraphicLight,
} from '../assets/marketplaceIntro'
import {Image, YStack} from '../primitives'
import {Typography} from './Typography'

export interface MarketplaceIntroDialogContentProps {
  readonly description: string
}

export function MarketplaceIntroDialogContent({
  description,
}: MarketplaceIntroDialogContentProps): React.JSX.Element {
  const graphic = useThemeName().startsWith('dark')
    ? marketplaceIntroDialogGraphicDark
    : marketplaceIntroDialogGraphicLight

  return (
    <YStack gap="$5" width="100%">
      <YStack
        alignSelf="center"
        width="100%"
        aspectRatio={320 / 422}
        overflow="hidden"
      >
        <Image source={graphic} width="100%" height="100%" objectFit="fill" />
      </YStack>
      <Typography
        variant="paragraphSmall"
        color="$foregroundSecondary"
        alignSelf="stretch"
        minWidth="100%"
        width="100%"
      >
        {description}
      </Typography>
    </YStack>
  )
}
