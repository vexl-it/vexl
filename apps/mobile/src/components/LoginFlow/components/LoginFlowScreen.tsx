import {
  Button,
  Stack,
  Typography,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import React, {type ReactNode} from 'react'
import {ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

interface Props {
  readonly action?: {
    readonly disabled?: boolean
    readonly label: string
    readonly onPress: () => void
  }
  readonly children: ReactNode
  readonly footer?: ReactNode
  readonly header?: ReactNode
  readonly scroll?: boolean
  readonly disableHorizontalPaddingForChildren?: boolean
}

export default function LoginFlowScreen({
  action,
  children,
  header,
  footer,
  disableHorizontalPaddingForChildren,
  scroll = false,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const content = (
    <YStack
      flex={1}
      justifyContent="space-between"
      paddingBottom={Math.max(insets.bottom, 16)}
      paddingTop={Math.max(insets.top, 20)}
    >
      <Stack>{header ?? null}</Stack>
      <YStack
        f={1}
        paddingHorizontal={disableHorizontalPaddingForChildren ? 0 : '$5'}
      >
        {children}
      </YStack>
      <YStack gap="$4" paddingHorizontal="$5">
        {footer ?? null}
        {action ? (
          <Button
            disabled={action.disabled}
            onPress={action.onPress}
            width="100%"
          >
            {action.label}
          </Button>
        ) : null}
      </YStack>
    </YStack>
  )

  if (scroll) {
    return (
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        style={{backgroundColor: theme.backgroundPrimary.val, flex: 1}}
      >
        {content}
      </ScrollView>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      {content}
    </YStack>
  )
}

export function LoginFlowTitle({
  children,
}: {
  readonly children: ReactNode
}): React.ReactElement {
  return (
    <Typography
      color="$foregroundPrimary"
      textAlign="center"
      variant="heading3"
    >
      {children}
    </Typography>
  )
}

export function LoginFlowText({
  children,
}: {
  readonly children: ReactNode
}): React.ReactElement {
  return (
    <Typography
      color="$foregroundSecondary"
      textAlign="center"
      variant="paragraphSmall"
    >
      {children}
    </Typography>
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

export function LoginFlowBottomRow({
  children,
}: {
  readonly children: ReactNode
}): React.ReactElement {
  return (
    <XStack alignItems="center" gap="$3" width="100%">
      {children}
    </XStack>
  )
}
