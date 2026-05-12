import {Button, Typography, YStack} from '@vexl-next/ui'
import React, {type ReactNode} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

interface Props {
  readonly children: ReactNode
  readonly primaryButton?: {
    readonly disabled?: boolean
    readonly label: string
    readonly onPress: () => void
  }
  readonly secondaryButton?: {
    readonly disabled?: boolean
    readonly label: string
    readonly onPress: () => void
  }
}

export default function PostLoginFlowScreen({
  children,
  primaryButton,
  secondaryButton,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()

  return (
    <YStack
      backgroundColor="$backgroundPrimary"
      flex={1}
      justifyContent="space-between"
      paddingBottom={Math.max(insets.bottom, 16)}
      paddingHorizontal="$5"
      paddingTop={Math.max(insets.top, 20)}
    >
      {children}
      <YStack flexDirection="row" gap="$3" width="100%">
        {secondaryButton ? (
          <Button
            disabled={secondaryButton.disabled}
            flex={1}
            onPress={secondaryButton.onPress}
            variant="secondary"
          >
            {secondaryButton.label}
          </Button>
        ) : null}
        {!!primaryButton && (
          <Button
            disabled={primaryButton.disabled}
            flex={1}
            onPress={primaryButton.onPress}
          >
            {primaryButton.label}
          </Button>
        )}
      </YStack>
    </YStack>
  )
}

export function PostLoginFlowCopy({
  text,
  title,
}: {
  readonly text: string
  readonly title: string
}): React.ReactElement {
  return (
    <YStack alignItems="center" gap="$4" width="100%">
      <Typography
        color="$foregroundPrimary"
        textAlign="center"
        variant="heading3"
      >
        {title}
      </Typography>
      <Typography
        color="$foregroundSecondary"
        textAlign="center"
        variant="paragraphSmall"
      >
        {text}
      </Typography>
    </YStack>
  )
}
