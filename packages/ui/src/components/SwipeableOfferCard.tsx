import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {tokens} from '../config/tokens'
import {ArchiveInbox} from '../icons/ArchiveInbox'
import {StarFilled} from '../icons/StarFilled'
import {StarOutline} from '../icons/StarOutline'
import {UnarchiveInbox} from '../icons/UnarchiveInbox'
import {type OfferCardMarkBadge} from './OfferCard'
import {SwipeActionPanel} from './SwipeableRow'

const PANEL_GAP = tokens.space[5].val
// Dragging past this distance commits the action on release. Shorter swipes
// reveal the action, which commits when tapped.
const FULL_SWIPE_COMMIT_DISTANCE = 180
// Vertical gap between list rows (matches the list's ItemSeparatorComponent).
const LIST_ROW_GAP = tokens.space[5].val
// Approximate settle time of the swipeable's closing spring. The exit slide
// waits it out so the card visibly returns to its resting position first.
const CLOSE_SETTLE_DURATION_MS = 250
// Favourites live above browse offers and archived below, so after closing
// the card slides towards its destination section, tucking in behind the
// neighbouring rows until it is gone.
const CARD_SLIDE_OUT_DURATION_MS = 250
const CARD_FADE_IN_DURATION_MS = 200

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
  /**
   * The returned promise can keep the card hidden until its consuming list
   * finishes moving it to the new position.
   */
  readonly onToggleMark: (
    target: SwipeableOfferCardMark
  ) => void | Promise<void>
  /**
   * Fires when a commit starts, before the card slides towards its new
   * section. Lets the list drop this row below its siblings so the card
   * visibly passes behind the neighbouring offers.
   */
  readonly onExitAnimationStart?: () => void
  readonly children: React.ReactNode
}

export function SwipeableOfferCard({
  offerId,
  mark,
  labels,
  onToggleMark,
  onExitAnimationStart,
  children,
}: SwipeableOfferCardProps): React.JSX.Element {
  const swipeableRef = useRef<SwipeableMethods>(null)
  const committedRef = useRef(false)
  const cardHeightRef = useRef(0)
  const offerIdRef = useRef(offerId)
  offerIdRef.current = offerId
  const isMountedRef = useRef(true)
  const slideOutTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  // Signed per-gesture drag distance, latched on the UI thread by the
  // observer pan. The swipeable's own translation keeps animating after
  // release, so sampling it from JS in the will-open/close callbacks is
  // timing dependent.
  const dragTranslation = useSharedValue(0)
  const cardOpacity = useSharedValue(1)
  const cardTranslateY = useSharedValue(0)

  // List cells get recycled. A cell reused for different data must not inherit
  // a mid-fade opacity or exit offset from the card it previously displayed.
  useEffect(() => {
    cardOpacity.set(1)
    cardTranslateY.set(0)
  }, [cardOpacity, cardTranslateY, offerId])

  // The exit choreography runs on JS timers, so it can outlive the row. Drop
  // the purely visual timer and stop touching shared values once unmounted.
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      clearTimeout(slideOutTimeoutRef.current)
    }
  }, [])

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.get(),
    transform: [{translateY: cardTranslateY.get()}],
  }))

  const commit = useCallback(
    (target: SwipeableOfferCardMark) => {
      // One-shot per gesture cycle. The action panel stays tappable while the
      // row springs closed after a full-swipe commit, so a second tap must not
      // invoke the action again.
      if (committedRef.current) return
      committedRef.current = true

      // Toggling a mark off returns the offer to the browse section in the
      // middle, so removing a favourite moves down and unarchiving moves up.
      const movesUp =
        target === 'favourite' ? mark !== 'favourite' : mark === 'archived'
      // A full row of travel tucks the card completely behind the adjacent
      // offer before the list closes the gap.
      const slideDistance = cardHeightRef.current + LIST_ROW_GAP
      const exitOffset = movesUp ? -slideDistance : slideDistance

      onExitAnimationStart?.()
      swipeableRef.current?.close()

      // JS timers rather than animation callbacks keep the mark commit itself
      // running even if FlashList recycles the closing row mid-way; the
      // offerId and mounted guards only skip the visuals in that case.
      clearTimeout(slideOutTimeoutRef.current)
      slideOutTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || offerIdRef.current !== offerId) return
        cardTranslateY.set(
          withTiming(exitOffset, {
            duration: CARD_SLIDE_OUT_DURATION_MS,
            easing: Easing.in(Easing.quad),
          })
        )
        // Stays opaque while still between the rows and only fades once it
        // is mostly tucked behind the neighbouring card.
        cardOpacity.set(
          withTiming(0, {
            duration: CARD_SLIDE_OUT_DURATION_MS,
            easing: Easing.in(Easing.cubic),
          })
        )
      }, CLOSE_SETTLE_DURATION_MS)

      // Deliberately not cleared on unmount: the mark has to be committed even
      // when the row is recycled before the slide-out finishes.
      setTimeout(() => {
        const restoreCard = (): void => {
          if (!isMountedRef.current || offerIdRef.current !== offerId) return
          cardTranslateY.set(0)
          cardOpacity.set(withTiming(1, {duration: CARD_FADE_IN_DURATION_MS}))
        }

        // Start from an already-resolved promise so synchronous callback
        // errors follow the same recovery path as rejected promises.
        void Promise.resolve()
          .then(() => onToggleMark(target))
          .then(restoreCard, restoreCard)
      }, CLOSE_SETTLE_DURATION_MS + CARD_SLIDE_OUT_DURATION_MS)
    },
    [
      cardOpacity,
      cardTranslateY,
      mark,
      offerId,
      onExitAnimationStart,
      onToggleMark,
    ]
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
    // Consume the latched distance on every open/close, not just when the
    // observer pan restarts. The swipeable's own pan can open or close a row
    // without the observer activating, and a leftover distance from an earlier
    // gesture would then commit an action the user never performed.
    const dragDistance = dragTranslation.get()
    dragTranslation.set(0)

    if (committedRef.current) return
    if (Math.abs(dragDistance) < FULL_SWIPE_COMMIT_DISTANCE) return

    commit(dragDistance > 0 ? 'favourite' : 'archived')
  }, [commit, dragTranslation])

  const isFavourite = mark === 'favourite'
  const isArchived = mark === 'archived'

  return (
    // The detector wraps the whole Swipeable because the swipeable applies
    // pointerEvents box-only to children while a row is open.
    <GestureDetector gesture={observerPan}>
      <Animated.View
        style={fadeStyle}
        onLayout={(event) => {
          cardHeightRef.current = event.nativeEvent.layout.height
        }}
      >
        <Swipeable
          key={offerId}
          ref={swipeableRef}
          simultaneousWithExternalGesture={observerPan}
          renderLeftActions={(_, translation) => (
            <SwipeActionPanel
              side="left"
              gap={PANEL_GAP}
              rounded
              variant="accent"
              translation={translation}
              icon={isFavourite ? StarOutline : StarFilled}
              label={isFavourite ? labels.removeFavourite : labels.favourite}
              onPress={() => {
                commit('favourite')
              }}
            />
          )}
          renderRightActions={(_, translation) => (
            <SwipeActionPanel
              side="right"
              gap={PANEL_GAP}
              rounded
              variant="neutral"
              translation={translation}
              icon={isArchived ? UnarchiveInbox : ArchiveInbox}
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
