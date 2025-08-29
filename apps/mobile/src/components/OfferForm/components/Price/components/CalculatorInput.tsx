import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Input, Stack, XStack, getTokens, styled, type InputProps} from 'tamagui'

const InputStyled = styled(Input, {
  f: 1,
  ff: '$body500',
  borderWidth: 0,
  height: '100%',
  fos: 18,
  color: '$main',
} as const)

interface Props extends InputProps {
  children: ReactNode
  isFocused: boolean
  onWrapperPress: () => void
}

function CalculatorInput(
  {children, isFocused, onWrapperPress, ...props}: Props,
  ref: Ref<Input>
): React.ReactElement {
  const inputRef: Ref<Input> = useRef(null)
  useImperativeHandle<Input | null, Input | null>(ref, () => inputRef.current)

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
            rows={1}
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

export default forwardRef<Input, Props>(CalculatorInput)
