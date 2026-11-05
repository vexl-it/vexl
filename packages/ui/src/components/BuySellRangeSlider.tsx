import React from 'react'

import {Stack, XStack, YStack} from '../primitives'
import {InfoBox, type InfoBoxVariant} from './InfoBox'
import {Slider} from './Slider'
import {Typography} from './Typography'

export interface BuySellRangeSliderProps {
  readonly title?: string
  readonly valueLabel?: string
  readonly leftLabel: string
  readonly rightLabel: string
  readonly minPercentage: number
  readonly maxPercentage: number
  readonly percentage: number
  readonly onPercentageChange: (percentage: number) => void
  readonly infoText: string
  readonly amountText?: string
}

export function BuySellRangeSlider({
  title,
  valueLabel,
  leftLabel,
  rightLabel,
  minPercentage,
  maxPercentage,
  percentage,
  onPercentageChange,
  infoText,
  amountText = '',
}: BuySellRangeSliderProps): React.JSX.Element {
  const range = maxPercentage - minPercentage
  const midPercentage = (minPercentage + maxPercentage) / 2
  const distanceFromCenter = Math.abs(percentage - midPercentage)
  const quarterRange = range / 4

  const bannerVariant: InfoBoxVariant =
    distanceFromCenter === 0
      ? 'default'
      : distanceFromCenter <= quarterRange
        ? 'yellow'
        : 'pink'

  return (
    <YStack gap="$5">
      {title ? (
        <XStack alignItems="center" justifyContent="space-between" gap="$4">
          <Typography
            variant="paragraphDemibold"
            color="$foregroundPrimary"
            flex={1}
          >
            {title}
          </Typography>
          {valueLabel ? (
            <XStack
              backgroundColor="$backgroundSecondary"
              paddingHorizontal="$4"
              paddingVertical="$3"
              borderRadius="$3"
            >
              <Typography variant="paragraphSmall" color="$foregroundPrimary">
                {valueLabel}
              </Typography>
            </XStack>
          ) : null}
        </XStack>
      ) : null}
      <YStack gap="$3">
        <Stack gap="$3" paddingHorizontal="$2">
          <XStack justifyContent="space-between">
            <Typography variant="micro" color="$foregroundPrimary">
              {leftLabel}
            </Typography>
            <Typography variant="micro" color="$foregroundPrimary">
              {rightLabel}
            </Typography>
          </XStack>
          <Slider
            min={minPercentage}
            max={maxPercentage}
            value={percentage}
            onValueChange={onPercentageChange}
          />
          {amountText.length > 0 ? (
            <XStack justifyContent="center" padding="$4">
              <Typography variant="micro" color="$foregroundSecondary">
                {amountText}
              </Typography>
            </XStack>
          ) : null}
        </Stack>
        <InfoBox variant={bannerVariant} iconSize={24} p="$5" gap="$3">
          {infoText}
        </InfoBox>
      </YStack>
    </YStack>
  )
}
