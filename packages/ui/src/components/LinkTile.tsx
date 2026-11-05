import React from 'react'
import {useTheme} from 'tamagui'

import {ArrowRight} from '../icons/ArrowRight'
import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface LinkTileProps {
  readonly label: string
  /** Brand logo or icon in front of the label. */
  readonly leading?: React.ReactNode
  readonly onPress?: () => void
}

/** Compact tile pointing somewhere else, e.g. an app store or an external tool. */
export function LinkTile({
  label,
  leading,
  onPress,
}: LinkTileProps): React.JSX.Element {
  const theme = useTheme()
  return (
    <XStack
      role={onPress ? 'link' : 'none'}
      onPress={onPress}
      alignItems="center"
      gap="$3"
      paddingHorizontal="$5"
      height="$11"
      borderRadius="$4"
      backgroundColor="$backgroundTertiary"
      hoverStyle={{opacity: 0.8}}
      pressStyle={{opacity: 0.7}}
    >
      {leading}
      <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
        {label}
      </Typography>
      <ArrowRight size={18} color={theme.foregroundSecondary.get()} />
    </XStack>
  )
}
