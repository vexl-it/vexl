import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTheme, type ColorTokens} from 'tamagui'

import {ChevronDown} from '../icons/ChevronDown'
import {Snowflake} from '../icons/Snowflake'
import {UserProfile} from '../icons/UserProfile'
import {XStack} from '../primitives'
import {AnimatedLiveIndicator} from './AnimatedLiveIndicator'
import {Typography} from './Typography'

export type TradePriceType = 'live' | 'frozen' | 'custom' | 'your'

export interface TradePriceTypeButtonProps {
  readonly priceType: TradePriceType
  /** E.g. "Live market price". */
  readonly label: string
  readonly onPress?: () => void
}

const textColors: Record<TradePriceType, ColorTokens> = {
  live: '$accentHighlightSecondary',
  frozen: '$pinkForeground',
  custom: '$greenForeground',
  your: '$greenForeground',
}

export function TradePriceTypeButton({
  priceType,
  label,
  onPress,
}: TradePriceTypeButtonProps): React.JSX.Element {
  const theme = useTheme()
  const chevronColor =
    priceType === 'live'
      ? theme.accentHighlightSecondary.get()
      : priceType === 'frozen'
        ? theme.pinkForeground.get()
        : theme.greenForeground.get()

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <XStack ai="center" gap="$2">
        <XStack ai="center" gap="$2">
          {priceType === 'live' ? (
            <AnimatedLiveIndicator color="$accentYellowPrimary" />
          ) : priceType === 'frozen' ? (
            <Snowflake size={16} color={theme.pinkForeground.get()} />
          ) : (
            <UserProfile size={16} color={theme.greenForeground.get()} />
          )}
          <Typography variant="paragraphSmall" color={textColors[priceType]}>
            {label}
          </Typography>
        </XStack>
        <ChevronDown color={chevronColor} size={20} />
      </XStack>
    </TouchableOpacity>
  )
}
