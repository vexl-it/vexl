import {Stack, XStack} from 'tamagui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import SvgImage from '../../../Image'
import dashSvg from './images/dashSvg'
import {
  type NativeSyntheticEvent,
  type TextInputChangeEventData,
} from 'react-native'
import Slider from '../Slider'
import {useAtom, useAtomValue} from 'jotai'
import LimitInput from './components/LimitInput'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../../atoms/offerFormStateAtoms'

const SLIDER_MIN_VALUE = 0

const SLIDER_MAX_VALUE_USD_EUR = 10000
const SLIDER_MAX_VALUE_CZK = 250000
const SLIDER_STEP_USD_EUR = 100
const SLIDER_STEP_CZK = 1000

export type InputType = 'min' | 'max'

function AmountOfTransaction(): JSX.Element {
  const {amountTopLimitAtom, amountBottomLimitAtom, currencyAtom} = useMolecule(
    offerFormStateMolecule
  )
  const [amountTopLimit, setAmountTopLimit] = useAtom(amountTopLimitAtom)
  const [amountBottomLimit, setAmountBottomLimit] = useAtom(
    amountBottomLimitAtom
  )
  const currency = useAtomValue(currencyAtom)
  const SLIDER_STEP = useMemo(
    () => (currency === 'CZK' ? SLIDER_STEP_CZK : SLIDER_STEP_USD_EUR),
    [currency]
  )
  const SLIDER_MAX_VALUE = useMemo(
    () =>
      currency === 'CZK' ? SLIDER_MAX_VALUE_CZK : SLIDER_MAX_VALUE_USD_EUR,
    [currency]
  )
  const [inputMin, setInputMin] = useState<number>(SLIDER_MIN_VALUE)
  const [inputMax, setInputMax] = useState<number>(SLIDER_MAX_VALUE)

  const setBottomLimit = useCallback(
    (bottomLimit: number): void => {
      setAmountBottomLimit(bottomLimit)
    },
    [setAmountBottomLimit]
  )

  const setTopLimit = useCallback(
    (topLimit: number): void => {
      setAmountTopLimit(topLimit)
    },
    [setAmountTopLimit]
  )

  const onSliderValueChange = (value: number[]): void => {
    if (amountBottomLimit !== value[0]) {
      setBottomLimit(value[0])
      setInputMin(value[0])
    }
    if (amountTopLimit !== value[1]) {
      setTopLimit(value[1])
      setInputMax(value[1])
    }
  }

  const handleInputTextChange = (text: string, inputType: InputType): void => {
    const numericString = text.replace(/[^0-9]/g, '')
    const value = Number(numericString)
    const clampedValue = Math.min(
      Math.max(value, SLIDER_MIN_VALUE),
      SLIDER_MAX_VALUE
    )
    if (inputType === 'min') setInputMin(Number(clampedValue))
    if (inputType === 'max') setInputMax(Number(clampedValue))
  }

  const handleInputBlur = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
    inputType: InputType
  ): void => {
    if (inputType === 'min') setBottomLimit(inputMin)
    if (inputType === 'max') setTopLimit(inputMax)
  }

  useEffect(() => {
    setInputMin(SLIDER_MIN_VALUE)
    setInputMax(SLIDER_MAX_VALUE)
  }, [currency, SLIDER_MAX_VALUE, setBottomLimit, setTopLimit])

  return (
    <>
      <XStack ai="center" mb="$2" justifyContent="space-around">
        <LimitInput
          onBlur={(value) => {
            handleInputBlur(value, 'min')
          }}
          onChangeText={(value) => {
            handleInputTextChange(value, 'min')
          }}
          value={String(inputMin)}
        />
        <Stack mx="$2">
          <SvgImage source={dashSvg} />
        </Stack>
        <LimitInput
          onBlur={(value) => {
            handleInputBlur(value, 'max')
          }}
          onChangeText={(value) => {
            handleInputTextChange(value, 'max')
          }}
          value={String(inputMax)}
        />
      </XStack>
      <Stack bc="$grey" px="$2" py="$6" br="$4">
        <Slider
          maximumValue={SLIDER_MAX_VALUE}
          minimumValue={SLIDER_MIN_VALUE}
          step={SLIDER_STEP}
          value={[amountBottomLimit, amountTopLimit]}
          onValueChange={onSliderValueChange}
        />
      </Stack>
    </>
  )
}

export default AmountOfTransaction
