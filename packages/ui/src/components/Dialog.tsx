import type {WritableAtom} from 'jotai'
import {atom, useAtomValue} from 'jotai'
import React, {useEffect, useRef, useState} from 'react'
import {Dimensions, Modal, Pressable, StyleSheet} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {styled} from 'tamagui'

import {SizableText, Stack, XStack, YStack} from '../primitives'
import {Button} from './Button'

const SCREEN_HEIGHT = Dimensions.get('window').height
const ANIMATION_DURATION = 300
const BACKDROP_OPACITY = 0.5
const AUTO_DISMISS_MS = 3000

export const DialogLabel = styled(SizableText, {
  name: 'DialogLabel',
  fontFamily: '$body',
  fontSize: '$1',
  fontWeight: '500',
  letterSpacing: '$1',
  color: '$foregroundSecondary',
})

export const DialogTitle = styled(SizableText, {
  name: 'DialogTitle',
  fontFamily: '$heading',
  fontSize: '$5',
  fontWeight: '400',
  color: '$foregroundPrimary',
})

export const DialogDescription = styled(SizableText, {
  name: 'DialogDescription',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '500',
  letterSpacing: '$3',
  color: '$foregroundSecondary',
})

export interface DialogProps {
  readonly visible: boolean
  readonly onClose?: () => void
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
}

export function Dialog({
  visible,
  onClose,
  children,
  footer,
}: DialogProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false)

  const backdropOpacity = useSharedValue(0)
  const translateY = useSharedValue(SCREEN_HEIGHT)

  const hasFooter = footer != null

  useEffect(() => {
    if (visible) {
      setMounted(true)
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: ANIMATION_DURATION,
      })
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    } else {
      backdropOpacity.value = withTiming(0, {duration: ANIMATION_DURATION})
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        {duration: ANIMATION_DURATION, easing: Easing.in(Easing.cubic)},
        (finished) => {
          if (finished) {
            scheduleOnRN(setMounted, false)
          }
        }
      )
    }
  }, [visible, backdropOpacity, translateY])

  useEffect(() => {
    if (visible && !hasFooter && onClose) {
      const timer = setTimeout(onClose, AUTO_DISMISS_MS)
      return () => {
        clearTimeout(timer)
      }
    }
    return undefined
  }, [visible, hasFooter, onClose])

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }))

  if (!mounted) return null

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Stack flex={1} justifyContent="flex-end">
        <Animated.View style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={contentAnimatedStyle}>
          <YStack
            paddingTop="$5"
            paddingBottom="$8"
            paddingHorizontal="$5"
            gap="$3"
          >
            <YStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              padding="$5"
              gap="$5"
            >
              {children}
            </YStack>
            {footer != null ? <XStack gap="$3">{footer}</XStack> : null}
          </YStack>
        </Animated.View>
      </Stack>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'black',
  },
})

export interface DialogAtomConfig {
  readonly title: string
  readonly subtitle?: string
  readonly children?: React.ReactNode
  readonly positiveButtonText: string
  readonly negativeButtonText?: string
}

interface DialogAtomInternalState extends DialogAtomConfig {
  readonly onResult: (confirmed: boolean) => void
}

export type DialogAtom = WritableAtom<
  DialogAtomInternalState | null,
  [config: DialogAtomConfig],
  Promise<boolean>
>

export function createDialogAtom(): DialogAtom {
  const stateAtom = atom<DialogAtomInternalState | null>(null)

  return atom(
    (get) => get(stateAtom),
    (get, set, config: DialogAtomConfig): Promise<boolean> => {
      const existing = get(stateAtom)
      existing?.onResult(false)

      return new Promise<boolean>((resolve) => {
        let resolved = false
        set(stateAtom, {
          ...config,
          onResult: (confirmed: boolean) => {
            if (resolved) return
            resolved = true
            set(stateAtom, null)
            resolve(confirmed)
          },
        })
      })
    }
  )
}

export interface DialogFromAtomProps {
  readonly dialogAtom: DialogAtom
}

export function DialogFromAtom({
  dialogAtom,
}: DialogFromAtomProps): React.JSX.Element {
  const state = useAtomValue(dialogAtom)
  const lastStateRef = useRef<DialogAtomInternalState | null>(null)

  if (state != null) {
    lastStateRef.current = state
  }

  const displayState = state ?? lastStateRef.current
  const hasNegativeButton = displayState?.negativeButtonText != null

  return (
    <Dialog
      visible={state != null}
      onClose={() => state?.onResult(false)}
      footer={
        displayState != null ? (
          <>
            {hasNegativeButton ? (
              <Button
                variant="secondary"
                size="large"
                flex={1}
                onPress={() => state?.onResult(false)}
              >
                {displayState.negativeButtonText}
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="large"
              flex={1}
              onPress={() => state?.onResult(true)}
            >
              {displayState.positiveButtonText}
            </Button>
          </>
        ) : undefined
      }
    >
      {displayState?.title != null ? (
        <DialogTitle>{displayState.title}</DialogTitle>
      ) : null}
      {displayState?.subtitle != null ? (
        <DialogDescription>{displayState.subtitle}</DialogDescription>
      ) : null}
      {displayState?.children ?? null}
    </Dialog>
  )
}
