import {InfoCircle, Typography, useTheme, XStack} from '@vexl-next/ui'
import React from 'react'

function InfoSquare({
  children,
  negative,
  onPress,
}: {
  children: string
  negative?: boolean
  onPress?: () => void
}): React.ReactElement {
  const theme = useTheme()
  const foregroundColor = negative
    ? theme.redForeground.val
    : theme.foregroundPrimary.val

  return (
    <XStack
      role={onPress ? 'button' : undefined}
      onPress={onPress}
      pressStyle={onPress ? {opacity: 0.8} : undefined}
      backgroundColor={negative ? '$redBackground' : '$backgroundTertiary'}
      padding="$3"
      borderRadius="$true"
      gap="$3"
      alignItems="center"
    >
      <InfoCircle size={16} color={foregroundColor} />
      <Typography
        flex={1}
        color={negative ? '$redForeground' : '$foregroundPrimary'}
        variant="paragraphSmall"
      >
        {children}
      </Typography>
    </XStack>
  )
}

export default InfoSquare
