import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {getFontScaleSync} from 'react-native-device-info'
import {Input, Stack, XStack, getTokens, styled, type InputProps} from 'tamagui'
import VexlActivityIndicator from '../../../../LoadingOverlayProvider/VexlActivityIndicator'
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
): React.ReactElement {
  const fontScale = getFontScaleSync()
  const inputRef: Ref<Input> = useRef(null)
  useImperativeHandle<Input | null, Input | null>(ref, () => inputRef.current)

  return (
    <TouchableWithoutFeedback onPress={onWrapperPress}>
      <Stack>
        <XStack
          h={65 * fontScale}
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
          <Stack flex={1} my="$-3">
            {loading ? (
              <Stack als="flex-end">
                <VexlActivityIndicator
                  size="small"
                  bc={getTokens().color.greyAccent2.val}
                />
              </Stack>
            ) : (
              <InputStyled
                ref={inputRef}
                placeholderTextColor={getTokens().color.greyAccent1.val}
                keyboardType="decimal-pad"
                rows={1}
                bc="$grey"
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
      </Stack>
    </TouchableWithoutFeedback>
  )
}

export default forwardRef<Input, Props>(AmountInput)
