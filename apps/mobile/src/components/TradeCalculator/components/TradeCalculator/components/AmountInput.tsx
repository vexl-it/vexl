import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'
import {
  ActivityIndicator,
  TextInput as RNTextInput,
  TouchableWithoutFeedback,
  type TextInputProps,
} from 'react-native'
import {Stack, XStack, getTokens, styled} from 'tamagui'
import PremiumIncluded from './PremiumIncluded'

const InputStyled = styled(RNTextInput, {
  f: 1,
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

interface Props extends TextInputProps {
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
  ref: Ref<RNTextInput>
): JSX.Element {
  const inputRef: Ref<RNTextInput> = useRef(null)
  useImperativeHandle<RNTextInput | null, RNTextInput | null>(
    ref,
    () => inputRef.current
  )

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
          <Stack fs={1} maxWidth="60%">
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
                numberOfLines={1}
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

export default forwardRef<RNTextInput, Props>(AmountInput)
