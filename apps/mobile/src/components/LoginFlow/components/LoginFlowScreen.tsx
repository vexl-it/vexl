import {
  Button,
  KeyboardAwareScrollView,
  KeyboardStickyView,
  Stack,
  Typography,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import React, {type ReactNode} from 'react'
import {type LayoutChangeEvent} from 'react-native'
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
  const footerHeightRef = React.useRef(0)
  const [footerHeight, setFooterHeight] = React.useState(0)
  const handleFooterLayout = React.useCallback((e: LayoutChangeEvent) => {
    const measuredFooterHeight = e.nativeEvent.layout.height
    if (footerHeightRef.current === measuredFooterHeight) return

    footerHeightRef.current = measuredFooterHeight
    setFooterHeight(measuredFooterHeight)
  }, [])

  const bottomContent =
    footer || action ? (
      <KeyboardStickyView
        style={{position: 'absolute', left: 0, right: 0, bottom: 0}}
      >
        <YStack
          gap="$4"
          paddingBottom={Math.max(insets.bottom, 16)}
          paddingHorizontal="$5"
          onLayout={handleFooterLayout}
        >
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
      </KeyboardStickyView>
    ) : null

  const content = (
    <YStack
      flex={1}
      paddingBottom={footerHeight}
      paddingTop={Math.max(insets.top, 20)}
    >
      <Stack>{header ?? null}</Stack>
      <YStack
        f={1}
        paddingHorizontal={disableHorizontalPaddingForChildren ? 0 : '$5'}
      >
        {children}
      </YStack>
    </YStack>
  )

  if (scroll) {
    return (
      <YStack flex={1} backgroundColor="$backgroundPrimary">
        <KeyboardAwareScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled"
          style={{backgroundColor: theme.backgroundPrimary.get(), flex: 1}}
          bottomOffset={footerHeight}
        >
          {content}
        </KeyboardAwareScrollView>
        {bottomContent}
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundPrimary">
      {content}
      {bottomContent}
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
