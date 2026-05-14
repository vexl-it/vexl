import {Effect} from 'effect'
import type {Atom, WritableAtom} from 'jotai'
import {atom, useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Dimensions, Modal} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens, styled} from 'tamagui'

import {SizableText, Stack, XStack, YStack} from '../primitives'
import {Button, type ButtonVariant} from './Button'

const SCREEN_HEIGHT = Dimensions.get('window').height
const ANIMATION_DURATION = 300
const BACKDROP_OPACITY = 0.5
const AUTO_DISMISS_MS = 2000
const falseAtom = atom(false)

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
  fontWeight: '700',
  lineHeight: 44,
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

const DialogBackdrop = styled(Stack, {
  name: 'DialogBackdrop',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '$black100',
})

const DialogViewport = styled(YStack, {
  name: 'DialogViewport',
  paddingTop: '$5',
  paddingHorizontal: '$5',
  gap: '$3',
})

const DialogCard = styled(YStack, {
  name: 'DialogCard',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  padding: '$5',
  gap: '$5',
})

const AnimatedDialogBackdrop = Animated.createAnimatedComponent(DialogBackdrop)

export interface DialogProps {
  readonly visible: boolean
  readonly onClose?: () => void
  readonly onHidden?: () => void
  readonly children: React.ReactNode
  readonly footer?: React.ReactNode
  readonly avoidKeyboard?: boolean
}

export function Dialog({
  visible,
  onClose,
  onHidden,
  children,
  footer,
  avoidKeyboard,
}: DialogProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false)

  const backdropOpacity = useSharedValue(0)
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const {bottom} = useSafeAreaInsets()
  const bottomOffset = bottom + getTokens().space.$8.val

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
            if (onHidden) {
              scheduleOnRN(onHidden)
            }
          }
        }
      )
    }
  }, [visible, backdropOpacity, translateY, onHidden])

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

  const content = (
    <Stack flex={1} justifyContent="flex-end">
      <AnimatedDialogBackdrop style={backdropAnimatedStyle} onPress={onClose} />
      <Animated.View style={contentAnimatedStyle}>
        <DialogViewport paddingBottom={bottomOffset}>
          <DialogCard>{children}</DialogCard>
          {footer != null ? <XStack gap="$3">{footer}</XStack> : null}
        </DialogViewport>
      </Animated.View>
    </Stack>
  )

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView behavior="height" style={{flex: 1}}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  )
}

export interface DialogAtomConfig {
  readonly title: string
  readonly subtitle?: string
  readonly children?: React.ReactNode
  readonly positiveButtonText: string
  readonly positiveButtonDisabledAtom?: Atom<boolean>
  readonly positiveButtonVariant?: ButtonVariant
  readonly negativeButtonText?: string
  readonly avoidKeyboard?: boolean
}

interface DialogAtomInternalState extends DialogAtomConfig {
  readonly onResult: (confirmed: boolean) => void
  readonly createdStack?: string
}

export type DialogAtom = WritableAtom<
  DialogAtomInternalState | null,
  [config: DialogAtomConfig],
  Effect.Effect<boolean>
>

export function createDialogAtom(): DialogAtom {
  const stateAtom = atom<DialogAtomInternalState | null>(null)

  return atom(
    (get) => get(stateAtom),
    (get, set, config: DialogAtomConfig): Effect.Effect<boolean> => {
      const existing = get(stateAtom)
      existing?.onResult(false)

      return Effect.async<boolean>((resolve) => {
        set(stateAtom, {
          ...config,
          onResult: (confirmed: boolean) => {
            set(stateAtom, null)
            resolve(Effect.succeed(confirmed))
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
  const [visible, setVisible] = useState(false)
  const [displayState, setDisplayState] =
    useState<DialogAtomInternalState | null>(null)
  const displayedStateRef = useRef<DialogAtomInternalState | null>(null)
  const pendingStateRef = useRef<DialogAtomInternalState | null>(null)
  const stateRef = useRef<DialogAtomInternalState | null>(null)
  stateRef.current = state

  useEffect(() => {
    if (state == null) {
      pendingStateRef.current = null

      if (displayedStateRef.current != null) {
        setVisible(false)
      }

      return
    }

    if (displayedStateRef.current == null) {
      displayedStateRef.current = state
      setDisplayState(state)
      setVisible(true)
      return
    }

    if (displayedStateRef.current !== state) {
      pendingStateRef.current = state
      setVisible(false)
    }
  }, [state])

  const handleHidden = useCallback(() => {
    const pendingState = pendingStateRef.current

    if (pendingState != null) {
      pendingStateRef.current = null
      displayedStateRef.current = pendingState
      setDisplayState(pendingState)
      setVisible(true)
      return
    }

    if (stateRef.current == null) {
      displayedStateRef.current = null
      setDisplayState(null)
      setVisible(false)
    }
  }, [])

  const positiveButtonDisabled = useAtomValue(
    displayState?.positiveButtonDisabledAtom ?? falseAtom
  )
  const hasNegativeButton = displayState?.negativeButtonText != null

  return (
    <Dialog
      visible={visible}
      onClose={() => displayState?.onResult(false)}
      onHidden={handleHidden}
      avoidKeyboard={displayState?.avoidKeyboard}
      footer={
        displayState != null ? (
          <>
            {hasNegativeButton ? (
              <Button
                variant="secondary"
                size="large"
                flex={1}
                onPress={() => {
                  displayState?.onResult(false)
                }}
              >
                {displayState.negativeButtonText}
              </Button>
            ) : null}
            <Button
              variant={displayState.positiveButtonVariant ?? 'primary'}
              size="large"
              flex={1}
              disabled={positiveButtonDisabled}
              onPress={() => {
                displayState?.onResult(true)
              }}
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
