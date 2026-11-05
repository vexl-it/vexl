import {Button, Screen, XStack, YStack} from '@vexl-next/ui'
import React, {type ReactNode} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens} from 'tamagui'

interface Action {
  readonly disabled?: boolean
  readonly label: string
  readonly onPress: () => void
}

interface Props {
  readonly children: ReactNode
  readonly header?: ReactNode
  readonly footer?: ReactNode
  readonly primaryAction?: Action
  readonly secondaryAction?: Action
  readonly noHorizontalPadding?: boolean
  readonly scrollable?: boolean
}

export default function LoginFlowScreen({
  children,
  header,
  footer,
  primaryAction,
  secondaryAction,
  noHorizontalPadding,
  scrollable,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()
  const hasActions = !!primaryAction || !!secondaryAction

  return (
    <Screen
      navigationBar={header ?? null}
      noHorizontalPadding={noHorizontalPadding}
      scrollable={scrollable}
      reserveFooterSpace
      footerFrameProps={{
        paddingBottom: Math.max(insets.bottom, getTokens().space.$5.val),
      }}
      footer={
        footer || hasActions ? (
          <YStack gap="$4">
            {footer}
            {hasActions ? (
              <XStack gap="$3">
                {secondaryAction ? (
                  <Button
                    flex={1}
                    variant="secondary"
                    disabled={secondaryAction.disabled}
                    onPress={secondaryAction.onPress}
                  >
                    {secondaryAction.label}
                  </Button>
                ) : null}
                {primaryAction ? (
                  <Button
                    flex={1}
                    disabled={primaryAction.disabled}
                    onPress={primaryAction.onPress}
                  >
                    {primaryAction.label}
                  </Button>
                ) : null}
              </XStack>
            ) : null}
          </YStack>
        ) : undefined
      }
    >
      {children}
    </Screen>
  )
}

export function LoginFlowCentered({
  children,
}: {
  readonly children: ReactNode
}): React.ReactElement {
  return (
    <YStack f={1} alignItems="center" justifyContent="center" gap="$8">
      {children}
    </YStack>
  )
}
