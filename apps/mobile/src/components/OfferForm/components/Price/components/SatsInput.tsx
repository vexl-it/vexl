import {
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack, Text} from 'tamagui'
import CalculatorInput from './CalculatorInput'

interface Props {
  calculateFiatValueOnSatsValueChangeActionAtom: WritableAtom<
    null,
    [satsString: string],
    void
  >
  satsValueAtom: PrimitiveAtom<number>
}

function SatsInput({
  calculateFiatValueOnSatsValueChangeActionAtom,
  satsValueAtom,
}: Props): React.ReactElement {
  const ref = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState<boolean>(false)

  const satsValue = useAtomValue(satsValueAtom)
  const calculateFiatValueOnSatsValueChange = useSetAtom(
    calculateFiatValueOnSatsValueChangeActionAtom
  )

  return (
    <CalculatorInput
      ref={ref}
      isFocused={isFocused}
      onBlur={() => {
        setIsFocused(false)
      }}
      onFocus={() => {
        setIsFocused(true)
      }}
      onWrapperPress={() => {
        ref.current?.focus()
      }}
      value={satsValue !== 0 ? String(satsValue) : undefined}
      onChangeText={(input) => {
        calculateFiatValueOnSatsValueChange(input)
      }}
    >
      <Stack>
        <Text fos={18} ff="$body500" col="$main">
          SATS
        </Text>
      </Stack>
    </CalculatorInput>
  )
}

export default SatsInput
