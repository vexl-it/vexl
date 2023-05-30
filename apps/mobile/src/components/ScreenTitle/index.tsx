import {
  type ColorTokens,
  Stack,
  Text,
  XStack,
  YStack,
  type YStackProps,
} from 'tamagui'
import {type ReactNode} from 'react'

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
    <YStack mt={'$2'} bc={'transparent'} {...props}>
      <XStack fd="row" ai="flex-start" jc="space-between" mb="$5">
        <Stack fs={1} maw="60%">
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
        {children && <XStack space={'$2'}>{children}</XStack>}
      </XStack>
      {withBottomBorder && <Stack h={0.5} mx="$-4" bg="$grey" />}
    </YStack>
  )
}

export default ScreenTitle
