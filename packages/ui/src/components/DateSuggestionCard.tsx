import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTheme} from 'tamagui'

import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface DateSuggestionCardProps {
  /** E.g. "Monday". */
  readonly weekday: string
  /** E.g. "6 Oct 2026". */
  readonly dateLabel: string
  /** Caption above the slots, e.g. "time slots" or "Outdated". */
  readonly slotsCaption: string
  /** E.g. "10:00, 14:30". */
  readonly slots?: string
  /** Dims the card and disables presses. */
  readonly outdated?: boolean
  readonly onPress: () => void
}

export function DateSuggestionCard({
  weekday,
  dateLabel,
  slotsCaption,
  slots,
  outdated,
  onPress,
}: DateSuggestionCardProps): React.JSX.Element {
  const theme = useTheme()
  const primaryTextColor = outdated
    ? theme.foregroundTertiary.get()
    : theme.foregroundPrimary.get()
  const secondaryTextColor = outdated
    ? theme.foregroundTertiary.get()
    : theme.foregroundSecondary.get()

  return (
    <TouchableOpacity
      disabled={outdated}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        backgroundColor={theme.backgroundSecondary.get()}
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$5"
        opacity={outdated ? 0.6 : 1}
      >
        <YStack flex={1} gap="$2">
          <Typography variant="micro" color={secondaryTextColor}>
            {weekday}
          </Typography>
          <Typography variant="paragraphSmall" color={primaryTextColor}>
            {dateLabel}
          </Typography>
        </YStack>
        <YStack alignItems="flex-end" gap="$2" maxWidth="45%" flexShrink={1}>
          <Typography
            variant="micro"
            color={secondaryTextColor}
            textAlign="right"
          >
            {slotsCaption}
          </Typography>
          {!!slots && (
            <Typography
              variant="description"
              color={
                outdated
                  ? theme.foregroundTertiary.get()
                  : theme.accentHighlightSecondary.get()
              }
              textAlign="right"
              numberOfLines={2}
            >
              {slots}
            </Typography>
          )}
        </YStack>
      </XStack>
    </TouchableOpacity>
  )
}
