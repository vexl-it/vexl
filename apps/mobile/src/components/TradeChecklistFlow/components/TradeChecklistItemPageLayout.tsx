import {
  Button,
  ChevronLeft,
  NavigationBar,
  type NavigationBarAction,
} from '@vexl-next/ui'
import React from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ScrollView, Stack, YStack} from 'tamagui'
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
  const {top, bottom} = useSafeAreaInsets()
  const goBack = useSafeGoBack()
  const content = contentPadding ? (
    <YStack f={1} p="$5">
      {children}
    </YStack>
  ) : (
    children
  )

  return (
    <YStack f={1} pt={top} pb={bottom}>
      {!!header && (
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
              void dismissKeyboardAndResolveOnLayoutUpdate().then(
                action.onPress
              )
            },
          }))}
        />
      )}
      <Stack f={1}>
        {scrollable ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </Stack>
      {footer}
      {!!bottomButton && (
        <YStack p="$5">
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
        </YStack>
      )}
    </YStack>
  )
}
