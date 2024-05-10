import {type ReactNode} from 'react'
import {
  Stack,
  Text,
  XStack,
  YStack,
  type ColorTokens,
  type YStackProps,
} from 'tamagui'

interface Props extends YStackProps {
  children?: ReactNode
  text: string
  textColor?: ColorTokens
  withBottomBorder?: boolean
}

function ScreenTitle({
  children,
  text,
  textColor,
  withBottomBorder = false,
  ...props
}: Props): JSX.Element {
  return (
    <YStack mt="$2" bc="transparent" space="$4" pb="$1" {...props}>
      <XStack ai="flex-start" jc="space-between" space="$2">
        <Stack fs={1}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={2}
            col={textColor ?? '$white'}
            fontSize={32}
            ff="$heading"
          >
            {text}
          </Text>
        </Stack>
        {!!children && (
          <XStack ai="center" jc="space-between">
            {children}
          </XStack>
        )}
      </XStack>
      {!!withBottomBorder && <Stack h={0.5} mx="$-4" bg="$grey" />}
    </YStack>
  )
}

export default ScreenTitle
