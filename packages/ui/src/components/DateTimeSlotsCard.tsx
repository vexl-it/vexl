import React, {useEffect, useState} from 'react'
import {TouchableOpacity} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const EXPAND_DURATION_MS = 220

export interface DateTimeSlotsCardProps {
  /** E.g. "monday". */
  readonly weekday: string
  /** E.g. "Oct 6, 2026". */
  readonly dateLabel: string
  readonly expanded: boolean
  readonly onExpand: () => void
  readonly onCollapse: () => void
  /** E.g. "10:00, 14:30". Replaces the expand toggle while collapsed. */
  readonly selectedSlots?: string
  /** Caption above `selectedSlots`, e.g. "time slots". */
  readonly selectedSlotsCaption: string
  /** E.g. "Add time slots". */
  readonly expandLabel: string
  /** E.g. "Hide time slots". */
  readonly collapseLabel: string
  /** Expanded content, e.g. `TimeSlotGroup`s and a save button. */
  readonly children: React.ReactNode
}

function useExpandAnimation(expanded: boolean): {
  readonly shouldRenderContent: boolean
  readonly onContentLayout: (height: number) => void
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>
} {
  const [shouldRenderContent, setShouldRenderContent] = useState(expanded)
  const progress = useSharedValue(expanded ? 1 : 0)
  const contentHeight = useSharedValue(1)

  useEffect(() => {
    if (expanded) setShouldRenderContent(true)

    progress.value = withTiming(
      expanded ? 1 : 0,
      {duration: EXPAND_DURATION_MS, easing: Easing.out(Easing.cubic)},
      (finished) => {
        if (finished && !expanded) scheduleOnRN(setShouldRenderContent, false)
      }
    )
  }, [expanded, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(progress.value, [0, 1], [0, contentHeight.value]),
    opacity: progress.value,
    transform: [{translateY: interpolate(progress.value, [0, 1], [-8, 0])}],
  }))

  return {
    shouldRenderContent,
    onContentLayout: (height) => {
      contentHeight.value = Math.ceil(height)
    },
    animatedStyle,
  }
}

export function DateTimeSlotsCard({
  weekday,
  dateLabel,
  expanded,
  onExpand,
  onCollapse,
  selectedSlots,
  selectedSlotsCaption,
  expandLabel,
  collapseLabel,
  children,
}: DateTimeSlotsCardProps): React.JSX.Element {
  const {shouldRenderContent, onContentLayout, animatedStyle} =
    useExpandAnimation(expanded)

  return (
    <Stack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      paddingHorizontal="$4"
      paddingVertical="$4"
      gap="$4"
    >
      <TouchableOpacity
        onPress={expanded ? undefined : onExpand}
        activeOpacity={expanded ? 1 : 0.85}
      >
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <YStack gap="$3" flex={1}>
            <Typography variant="micro" color="$foregroundSecondary">
              {weekday}
            </Typography>
            <Typography variant="paragraphSmall" color="$foregroundPrimary">
              {dateLabel}
            </Typography>
          </YStack>
          {selectedSlots && !expanded ? (
            <YStack alignItems="flex-end" gap="$2" maxWidth="45%">
              <Typography variant="micro" color="$foregroundSecondary">
                {selectedSlotsCaption}
              </Typography>
              <Typography
                variant="descriptionBold"
                color="$accentHighlightSecondary"
                textAlign="right"
              >
                {selectedSlots}
              </Typography>
            </YStack>
          ) : (
            <TouchableOpacity
              onPress={expanded ? onCollapse : onExpand}
              activeOpacity={0.85}
            >
              <Typography
                variant="description"
                color="$accentHighlightSecondary"
              >
                {expanded ? collapseLabel : expandLabel}
              </Typography>
            </TouchableOpacity>
          )}
        </XStack>
      </TouchableOpacity>

      {shouldRenderContent ? (
        <Animated.View style={[{overflow: 'hidden'}, animatedStyle]}>
          <Stack
            gap="$5"
            paddingTop="$5"
            onLayout={(event) => {
              onContentLayout(event.nativeEvent.layout.height)
            }}
          >
            {children}
          </Stack>
        </Animated.View>
      ) : null}
    </Stack>
  )
}
