import {ArrowLeft, NavButton, Typography} from '@vexl-next/ui'
import React, {type ReactNode} from 'react'
import {
  Stack,
  XStack,
  YStack,
  type ColorTokens,
  type YStackProps,
} from 'tamagui'
import useSafeGoBack from '../../utils/useSafeGoBack'

interface Props extends YStackProps {
  children?: ReactNode
  text: string
  textColor?: ColorTokens
  withBottomBorder?: boolean
  allowMultipleLines?: boolean
  withBackButton?: boolean
  onBackButtonPress?: () => void
}

function ScreenTitle({
  children,
  text,
  textColor,
  withBottomBorder = false,
  allowMultipleLines = false,
  withBackButton,
  onBackButtonPress,
  ...props
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()

  return (
    <YStack bc="transparent" gap="$4" mt="$5" pb="$1" {...props}>
      <XStack ai="center" gap="$4">
        {!!withBackButton && (
          <NavButton
            variant="highlighted"
            icon={ArrowLeft}
            testID="@screenTitle/backButton"
            onPress={() => {
              if (onBackButtonPress) onBackButtonPress()
              else safeGoBack()
            }}
          />
        )}
        <Stack f={1}>
          <Typography
            adjustsFontSizeToFit={!allowMultipleLines}
            numberOfLines={allowMultipleLines ? undefined : 1}
            color={textColor ?? '$foregroundPrimary'}
            variant="titlesSmall"
            textAlign="center"
          >
            {text}
          </Typography>
        </Stack>
        {!!children && (
          <XStack ai="center" jc="flex-end">
            {children}
          </XStack>
        )}
        <Stack w={24} />
      </XStack>
      {!!withBottomBorder && (
        <Stack h={0.5} mx="$-4" bg="$backgroundTertiary" />
      )}
    </YStack>
  )
}

export default ScreenTitle
