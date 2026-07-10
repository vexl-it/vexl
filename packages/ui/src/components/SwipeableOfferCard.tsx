import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {TouchableOpacity} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens, useTheme} from 'tamagui'

import {ArchiveInbox} from '../icons/ArchiveInbox'
import {StarFilled} from '../icons/StarFilled'
import {StarOutline} from '../icons/StarOutline'
import {UnarchiveInbox} from '../icons/UnarchiveInbox'
import type {IconProps} from '../icons/types'
import {Stack, YStack} from '../primitives'
import {type OfferCardMarkBadge} from './OfferCard'
import {Typography} from './Typography'

const PANEL_WIDTH = 86
const PANEL_GAP = getTokens().space.$5.val
// Dragging past this distance commits the action on release. Shorter swipes
// reveal the action, which commits when tapped.
const FULL_SWIPE_COMMIT_DISTANCE = 180
const CARD_FADE_OUT_DURATION_MS = 200
const CARD_FADE_IN_DURATION_MS = 300

export type SwipeableOfferCardMark = OfferCardMarkBadge

export interface SwipeableOfferCardLabels {
  readonly archive: string
  readonly favourite: string
  readonly removeFavourite: string
  readonly unarchive: string
}

export interface SwipeableOfferCardProps {
  /** Resets swipe and fade state when a recycled list row receives new data. */
  readonly offerId: string
  readonly mark?: SwipeableOfferCardMark
  readonly labels: SwipeableOfferCardLabels
  readonly onToggleMark: (target: SwipeableOfferCardMark) => void
  readonly children: React.ReactNode
}

type SwipeSide = 'left' | 'right'

function SwipeActionPanel({
  side,
  variant,
  icon,
  iconColor,
  label,
  translation,
  onPress,
}: {
  readonly side: SwipeSide
  readonly variant: 'accent' | 'normal'
  readonly icon: React.ComponentType<IconProps>
  readonly iconColor: string
  readonly label: string
  readonly translation: SharedValue<number>
  readonly onPress: () => void
}): React.JSX.Element {
  const Icon = icon
  // The action renderer keeps its measured width while the card closes.
  // Clip the panel to the revealed area so it is not painted underneath the
  // card after the gap is covered.
  const clipStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.abs(translation.get()) - PANEL_GAP),
  }))

  // The panel stretches with the drag so it fills the revealed area up to the
  // gap before the card.
  const panelStyle = useAnimatedStyle(() => ({
    width: Math.max(PANEL_WIDTH, Math.abs(translation.get()) - PANEL_GAP),
  }))

  return (
    <Stack width={PANEL_WIDTH + PANEL_GAP}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            overflow: 'hidden',
            ...(side === 'left' ? {left: 0} : {right: 0}),
          },
          clipStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              ...(side === 'left' ? {left: 0} : {right: 0}),
            },
            panelStyle,
          ]}
        >
          <TouchableOpacity style={{flex: 1}} onPress={onPress}>
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$1"
              borderRadius="$5"
              backgroundColor={
                variant === 'accent'
                  ? '$accentYellowSecondary'
                  : '$backgroundTertiary'
              }
            >
              <Icon size={24} color={iconColor} />
              <Typography
                variant="micro"
                color={
                  variant === 'accent'
                    ? '$accentHighlightPrimary'
                    : '$foregroundPrimary'
                }
              >
                {label}
              </Typography>
            </YStack>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Stack>
  )
}

export function SwipeableOfferCard({
  offerId,
  mark,
  labels,
  onToggleMark,
  children,
}: SwipeableOfferCardProps): React.JSX.Element {
  const theme = useTheme()
  const swipeableRef = useRef<SwipeableMethods>(null)
  const committedRef = useRef(false)
  // Signed per-gesture drag distance, latched on the UI thread by the
  // observer pan. The swipeable's own translation keeps animating after
  // release, so sampling it from JS in the will-open/close callbacks is
  // timing dependent.
  const dragTranslation = useSharedValue(0)
  const cardOpacity = useSharedValue(1)

  // List cells get recycled. A cell reused for different data must not inherit
  // a mid-fade opacity from the card it previously displayed.
  useEffect(() => {
    cardOpacity.set(1)
  }, [cardOpacity, offerId])

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
  }))

  const performMarkToggle = useCallback(
    (target: SwipeableOfferCardMark) => {
      onToggleMark(target)
      cardOpacity.set(withTiming(1, {duration: CARD_FADE_IN_DURATION_MS}))
    },
    [cardOpacity, onToggleMark]
  )

  const commit = useCallback(
    (target: SwipeableOfferCardMark) => {
      // One-shot per gesture cycle. The action panel stays tappable while the
      // row springs closed after a full-swipe commit, so a second tap must not
      // invoke the action again.
      if (committedRef.current) return
      committedRef.current = true

      swipeableRef.current?.close()
      cardOpacity.set(
        withTiming(0, {duration: CARD_FADE_OUT_DURATION_MS}, () => {
          'worklet'
          scheduleOnRN(performMarkToggle, target)
        })
      )
    },
    [cardOpacity, performMarkToggle]
  )

  const resetCommitGuard = useCallback(() => {
    committedRef.current = false
  }, [])

  const observerPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onStart(() => {
          'worklet'
          dragTranslation.set(0)
          scheduleOnRN(resetCommitGuard)
        })
        .onUpdate((event) => {
          'worklet'
          dragTranslation.set(event.translationX)
        }),
    [dragTranslation, resetCommitGuard]
  )

  const handleSwipeRelease = useCallback(() => {
    if (committedRef.current) return

    const dragDistance = dragTranslation.get()
    if (Math.abs(dragDistance) < FULL_SWIPE_COMMIT_DISTANCE) return

    commit(dragDistance > 0 ? 'favourite' : 'archived')
  }, [commit, dragTranslation])

  const isFavourite = mark === 'favourite'
  const isArchived = mark === 'archived'

  return (
    // The detector wraps the whole Swipeable because the swipeable applies
    // pointerEvents box-only to children while a row is open.
    <GestureDetector gesture={observerPan}>
      <Animated.View style={fadeStyle}>
        <Swipeable
          key={offerId}
          ref={swipeableRef}
          friction={1}
          overshootFriction={1}
          simultaneousWithExternalGesture={observerPan}
          renderLeftActions={(_, translation) => (
            <SwipeActionPanel
              side="left"
              variant="accent"
              translation={translation}
              icon={isFavourite ? StarOutline : StarFilled}
              iconColor={theme.accentHighlightPrimary.get()}
              label={isFavourite ? labels.removeFavourite : labels.favourite}
              onPress={() => {
                commit('favourite')
              }}
            />
          )}
          renderRightActions={(_, translation) => (
            <SwipeActionPanel
              side="right"
              variant="normal"
              translation={translation}
              icon={isArchived ? UnarchiveInbox : ArchiveInbox}
              iconColor={theme.foregroundPrimary.get()}
              label={isArchived ? labels.unarchive : labels.archive}
              onPress={() => {
                commit('archived')
              }}
            />
          )}
          onSwipeableWillOpen={handleSwipeRelease}
          onSwipeableWillClose={handleSwipeRelease}
        >
          {children}
        </Swipeable>
      </Animated.View>
    </GestureDetector>
  )
}
