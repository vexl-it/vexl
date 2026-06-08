import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  YStack,
  type NavigationBarAction,
} from '@vexl-next/ui'
import React from 'react'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../utils/dismissKeyboardPromise'
import useSafeGoBack from '../../../utils/useSafeGoBack'

export function TradeChecklistItemPageLayout({
  header,
  bottomButton,
  footer,
  scrollable = true,
  contentPadding = true,
  hideLeftChevron = false,
  children,
}: {
  header?: {
    title: string
    onBackPress?: () => void
    rightActions?: readonly NavigationBarAction[]
  }
  hideLeftChevron?: boolean
  bottomButton?: {
    disabled: boolean
    text: string
    onPress: () => void
    variant?: 'primary' | 'secondary'
  }
  footer?: React.ReactNode
  scrollable?: boolean
  contentPadding?: boolean
  children: React.ReactNode
}): React.ReactNode {
  const goBack = useSafeGoBack()

  const content = contentPadding ? (
    <YStack f={1} p="$5">
      {children}
    </YStack>
  ) : (
    children
  )

  const navigationBar = header ? (
    <NavigationBar
      style="back"
      title={header.title}
      leftAction={
        !hideLeftChevron
          ? {
              icon: ChevronLeft,
              onPress: () => {
                void dismissKeyboardAndResolveOnLayoutUpdate().then(
                  header.onBackPress ?? goBack
                )
              },
            }
          : undefined
      }
      rightActions={header.rightActions?.map((action) => ({
        ...action,
        onPress: () => {
          void dismissKeyboardAndResolveOnLayoutUpdate().then(action.onPress)
        },
      }))}
    />
  ) : null

  const footerContent =
    footer || bottomButton ? (
      <YStack gap="$5">
        {footer}
        {!!bottomButton && (
          <Button
            variant={bottomButton.variant ?? 'primary'}
            disabled={bottomButton.disabled}
            onPress={() => {
              void dismissKeyboardAndResolveOnLayoutUpdate().then(
                bottomButton.onPress
              )
            }}
          >
            {bottomButton.text}
          </Button>
        )}
      </YStack>
    ) : undefined

  return (
    <Screen
      navigationBar={navigationBar}
      scrollable={scrollable}
      noHorizontalPadding
      footer={footerContent}
    >
      {content}
    </Screen>
  )
}
