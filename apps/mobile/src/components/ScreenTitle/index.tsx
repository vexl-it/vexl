import {type ReactNode} from 'react'
import {
  Stack,
  Text,
  XStack,
  YStack,
  type ColorTokens,
  type YStackProps,
} from 'tamagui'
import chevronLeftSvg from '../../images/chevronLeftSvg'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'

interface Props extends YStackProps {
  children?: ReactNode
  text: string
  textColor?: ColorTokens
  withBottomBorder?: boolean
  withBackButton?: boolean
  onBackButtonPress?: () => void
}

function ScreenTitle({
  children,
  text,
  textColor,
  withBottomBorder = false,
  withBackButton,
  onBackButtonPress,
  ...props
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()

  return (
    <YStack bc="transparent" gap="$4" pb="$1" {...props}>
      <XStack ai="flex-start" gap="$4">
        {!!withBackButton && (
          <IconButton
            testID="@screenTitle/backButton"
            variant="primary"
            icon={chevronLeftSvg}
            onPress={() => {
              if (onBackButtonPress) onBackButtonPress()
              else safeGoBack()
            }}
          />
        )}
        <Stack f={1}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            col={textColor ?? '$white'}
            fontSize={32}
            ff="$heading"
          >
            {text}
          </Text>
        </Stack>
        {!!children && (
          <XStack ai="center" jc="flex-end">
            {children}
          </XStack>
        )}
      </XStack>
      {!!withBottomBorder && <Stack h={0.5} mx="$-4" bg="$grey" />}
    </YStack>
  )
}

export default ScreenTitle
