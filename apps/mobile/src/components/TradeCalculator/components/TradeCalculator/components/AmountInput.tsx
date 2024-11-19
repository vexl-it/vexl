import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'
import {ActivityIndicator, TouchableWithoutFeedback} from 'react-native'
import {Input, Stack, XStack, getTokens, styled, type InputProps} from 'tamagui'
import PremiumIncluded from './PremiumIncluded'

const InputStyled = styled(Input, {
  f: 1,
  borderWidth: 0,
  height: '100%',
  ff: '$body500',
  fos: 18,
  variants: {
    textColor: {
      '...color': (color) => {
        return {
          color,
        }
      },
    },
  } as const,
})

interface Props extends InputProps {
  isFocused?: boolean
  children: ReactNode
  loading?: boolean
  onWrapperPress?: () => void
  showPremiumInfoMessage?: boolean
}

function AmountInput(
  {
    children,
    isFocused,
    loading,
    onWrapperPress,
    showPremiumInfoMessage,
    ...props
  }: Props,
  ref: Ref<Input>
): JSX.Element {
  const inputRef: Ref<Input> = useRef(null)
  useImperativeHandle<Input | null, Input | null>(ref, () => inputRef.current)

  return (
    <TouchableWithoutFeedback onPress={onWrapperPress}>
      <>
        <XStack
          h={65}
          ai="center"
          jc="space-between"
          bc="$grey"
          boc={isFocused ? '$yellowAccent2' : 'transparent'}
          bw={2}
          px="$4"
          py="$3"
          br="$4"
        >
          {children}
          <Stack fs={1} flex={1} maxWidth="60%" my="$-3">
            {loading ? (
              <Stack als="flex-end">
                <ActivityIndicator
                  size="small"
                  color={getTokens().color.greyAccent2.val}
                />
              </Stack>
            ) : (
              <InputStyled
                ref={inputRef}
                placeholderTextColor={getTokens().color.greyAccent1.val}
                keyboardType="decimal-pad"
                rows={1}
                textAlign="right"
                selectTextOnFocus
                textColor={isFocused ? '$main' : '$white'}
                selectionColor={
                  isFocused
                    ? getTokens().color.yellowAccent1.val
                    : getTokens().color.white.val
                }
                focusStyle={{
                  textColor: '$main',
                }}
                {...props}
              />
            )}
          </Stack>
        </XStack>
        {!!showPremiumInfoMessage && <PremiumIncluded />}
      </>
    </TouchableWithoutFeedback>
  )
}

export default forwardRef<Input, Props>(AmountInput)
