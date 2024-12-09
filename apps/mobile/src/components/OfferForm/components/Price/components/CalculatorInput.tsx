import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'
import {
  TextInput as RNTextInput,
  TouchableWithoutFeedback,
  type TextInputProps,
} from 'react-native'
import {Stack, XStack, getTokens, styled} from 'tamagui'

const InputStyled = styled(RNTextInput, {
  f: 1,
  ff: '$body500',
  fos: 18,
  color: '$main',
} as const)

interface Props extends TextInputProps {
  children: ReactNode
  isFocused: boolean
  onWrapperPress: () => void
}

function CalculatorInput(
  {children, isFocused, onWrapperPress, ...props}: Props,
  ref: Ref<RNTextInput>
): JSX.Element {
  const inputRef: Ref<RNTextInput> = useRef(null)
  useImperativeHandle<RNTextInput | null, RNTextInput | null>(
    ref,
    () => inputRef.current
  )

  return (
    <TouchableWithoutFeedback onPress={onWrapperPress}>
      <XStack
        h={56}
        ai="center"
        jc="space-between"
        bc="$grey"
        boc={isFocused ? '$yellowAccent2' : 'transparent'}
        bw={2}
        px="$4"
        py="$3"
        br="$5"
      >
        <Stack w="60%">
          <InputStyled
            ref={inputRef}
            keyboardType="decimal-pad"
            numberOfLines={1}
            textAlign="left"
            selectTextOnFocus
            selectionColor={getTokens().color.yellowAccent1.val}
            {...props}
          />
        </Stack>
        {children}
      </XStack>
    </TouchableWithoutFeedback>
  )
}

export default forwardRef<RNTextInput, Props>(CalculatorInput)
