import {
  type ColorTokens,
  Stack,
  Text,
  XStack,
  YStack,
  type YStackProps,
} from 'tamagui'
import {type ReactNode} from 'react'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import useSafeGoBack from '../../utils/useSafeGoBack'

interface Props extends YStackProps {
  children?: ReactNode
  text: string
  textColor?: ColorTokens
  withBottomBorder?: boolean
  showCloseButton?: boolean
}

function ScreenTitle({
  children,
  text,
  textColor,
  withBottomBorder = false,
  showCloseButton,
  ...props
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
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
        {showCloseButton && <IconButton icon={closeSvg} onPress={safeGoBack} />}
        {children && (
          <XStack ai={'center'} space={'$2'}>
            {children}
          </XStack>
        )}
      </XStack>
      {withBottomBorder && <Stack h={0.5} mx="$-4" bg="$grey" />}
    </YStack>
  )
}

export default ScreenTitle
