import {Stack, Text, XStack, YStack, type YStackProps} from 'tamagui'
import {type ReactNode} from 'react'

interface Props extends YStackProps {
  children: ReactNode
  text: string
  withBottomBorder?: boolean
}

function ScreenTitle({
  children,
  text,
  withBottomBorder = false,
  ...props
}: Props): JSX.Element {
  return (
    <YStack {...props}>
      <XStack fd="row" ai="flex-start" jc="space-between" mb="$5">
        <Stack fs={1} maw="70%">
          <Text color="$white" fontSize={32} ff="$heading">
            {text}
          </Text>
        </Stack>
        <XStack space={'$2'}>{children}</XStack>
      </XStack>
      {withBottomBorder && <Stack h={0.5} mx="$-4" bg="$grey" />}
    </YStack>
  )
}

export default ScreenTitle
