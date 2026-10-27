import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTheme} from 'tamagui'

import {XStack, YStack} from '../primitives'
import {Loader} from './Loader'
import {Typography, type TypographyProps} from './Typography'

export interface BtcPriceLabelProps extends Omit<
  TypographyProps,
  'children' | 'color' | 'variant' | 'onPress' | 'disabled'
> {
  /** E.g. "1 BTC = 1 234 567 CZK". */
  readonly priceLabel: string
  /** Shows a loader instead of the price. */
  readonly loading?: boolean
  /** E.g. "Last updated: 6. 10. 14:30". */
  readonly lastUpdatedLabel?: string
  readonly onPress?: () => void
  readonly disabled?: boolean
  readonly trailingElement?: React.ReactNode
}

export function BtcPriceLabel({
  priceLabel,
  loading,
  lastUpdatedLabel,
  onPress,
  disabled,
  trailingElement,
  ...typographyProps
}: BtcPriceLabelProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      onPress={onPress}
    >
      <XStack ai="center" gap="$2">
        {loading ? (
          <Loader size="small" color={theme.foregroundSecondary.get()} />
        ) : (
          <YStack>
            <Typography
              variant="paragraphSmall"
              color="$foregroundPrimary"
              {...typographyProps}
            >
              {priceLabel}
            </Typography>
            {lastUpdatedLabel != null ? (
              <Typography variant="micro" color="$foregroundTertiary">
                {lastUpdatedLabel}
              </Typography>
            ) : null}
          </YStack>
        )}
        {trailingElement}
      </XStack>
    </TouchableOpacity>
  )
}
