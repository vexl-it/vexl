import {Typography} from '@vexl-next/ui'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {XStack} from 'tamagui'

interface MarketplaceInlineButtonProps {
  readonly icon: React.ReactNode
  readonly label: string
  readonly color: string
  readonly onPress: () => void
}

function MarketplaceInlineButton({
  icon,
  label,
  color,
  onPress,
}: MarketplaceInlineButtonProps): React.ReactElement {
  return (
    <TouchableOpacity onPress={onPress}>
      <XStack alignItems="center" gap="$2">
        {icon}
        <Typography variant="description" color={color}>
          {label}
        </Typography>
      </XStack>
    </TouchableOpacity>
  )
}

export default MarketplaceInlineButton
