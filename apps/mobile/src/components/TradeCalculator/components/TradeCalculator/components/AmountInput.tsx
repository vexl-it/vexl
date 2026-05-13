import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {getFontScaleSync} from 'react-native-device-info'
import {Input, Stack, XStack, styled, useTheme, type InputProps} from 'tamagui'
import VexlActivityIndicator from '../../../../LoadingOverlayProvider/VexlActivityIndicator'
import PremiumIncluded from './PremiumIncluded'

const InputStyled = styled(Input, {
  f: 1,
  backgroundColor: 'transparent',
  borderWidth: 0,
  height: '100%',
  ff: '$body500',
  fos: 18,
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
  const theme = useTheme()
  const inputRef: Ref<Input> = useRef(null)
  useImperativeHandle<Input | null, Input | null>(ref, () => inputRef.current)
  const hasValue =
    props.value !== undefined &&
    props.value !== null &&
    String(props.value).trim().length > 0

  return (
    <TouchableWithoutFeedback onPress={onWrapperPress}>
      <Stack>
        <XStack
          minHeight={64 * fontScale}
          ai="center"
          jc="space-between"
          backgroundColor="$backgroundSecondary"
          borderColor={isFocused ? '$accentHighlightSecondary' : 'transparent'}
          borderWidth={1}
          px="$5"
          py="$4"
          br="$5"
          gap="$3"
        >
          {children}
          <Stack flex={1} my="$-2">
            {loading ? (
              <Stack als="flex-end" py="$2">
                <VexlActivityIndicator
                  size="small"
                  bc={theme.foregroundTertiary.get()}
                />
              </Stack>
            ) : (
              <InputStyled
                ref={inputRef}
                color={
                  isFocused || hasValue
                    ? theme.foregroundPrimary.get()
                    : theme.foregroundTertiary.get()
                }
                placeholderTextColor={theme.foregroundTertiary.get()}
                keyboardType="decimal-pad"
                textAlign="right"
                selectTextOnFocus
                selectionColor={theme.accentHighlightSecondary.get()}
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
