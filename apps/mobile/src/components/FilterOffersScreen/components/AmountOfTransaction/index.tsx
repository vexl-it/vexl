import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import SvgImage from '../../../Image'
import {type PrimitiveAtom, useAtom, useAtomValue} from 'jotai'
import LimitInput from './components/LimitInput'
import {type CurrencyCode} from '@vexl-next/domain/dist/general/offers'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import infoSvg from '../../../images/infoSvg'
import Slider from '../../../Slider'
import dashSvg from '../../../images/dashSvg'
import {DateTime} from 'luxon'
import {currencies} from '../../../../utils/localization/currency'

const SLIDER_MIN_VALUE = 0
const INPUT_MIN_VALUE = 0
const SLIDER_STEP_SMALL = 100
const SLIDER_STEP_MEDIUM = 1000
const SLIDER_STEP_LARGE = 1000

export type InputType = 'min' | 'max'

interface Props {
  amountTopLimitAtom: PrimitiveAtom<number | undefined>
  amountBottomLimitAtom: PrimitiveAtom<number | undefined>
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
}

function AmountOfTransaction({
  amountTopLimitAtom,
  amountBottomLimitAtom,
  currencyAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()

  const [amountTopLimit, setAmountTopLimit] = useAtom(amountTopLimitAtom)
  const [amountBottomLimit, setAmountBottomLimit] = useAtom(
    amountBottomLimitAtom
  )
  const [, setDate] = useState(DateTime.now())
  const [forceRerender, setForceRerender] = useState(false)

  const currency = useAtomValue(currencyAtom)
  const SLIDER_STEP = useMemo(
    () =>
      currency && currencies[currency].maxAmount <= 25000
        ? SLIDER_STEP_SMALL
        : currency && currencies[currency].maxAmount <= 250000
        ? SLIDER_STEP_MEDIUM
        : SLIDER_STEP_LARGE,
    [currency]
  )
  const SLIDER_MAX_VALUE = useMemo(
    () => (currency ? currencies[currency].maxAmount : 0),
    [currency]
  )
  const [inputMin, setInputMin] = useState<number | undefined>(
    amountBottomLimit
  )
  const [inputMax, setInputMax] = useState<number | undefined>(amountTopLimit)

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
      Math.max(value, INPUT_MIN_VALUE),
      SLIDER_MAX_VALUE
    )
    if (inputType === 'min') {
      setBottomLimit(clampedValue)
      setInputMin(Number(clampedValue))
    }
    if (inputType === 'max') {
      setTopLimit(clampedValue)
      setInputMax(Number(clampedValue))
    }
    setForceRerender((v) => !v)
  }

  // this useEffect needs to be defined exactly this way as slider component needs to rerender once more
  // each time currency changes otherwise there will be bugs in UI if it relies on atom values only
  useEffect(() => {
    setInputMin(amountBottomLimit)
    setInputMax(amountTopLimit ?? SLIDER_MAX_VALUE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency])

  // need this to add rerender after setting value for slider through Input, as slider UI did not
  // rerender correctly before
  useEffect(() => {
    setDate(DateTime.now())
  }, [forceRerender])

  return currency &&
    amountBottomLimit !== undefined &&
    amountTopLimit !== undefined ? (
    <>
      <XStack ai="center" mb="$2" justifyContent="space-around">
        <LimitInput
          currencyAtom={currencyAtom}
          onChangeText={(value) => {
            handleInputTextChange(value, 'min')
          }}
          value={String(inputMin)}
        />
        <Stack mx="$2">
          <SvgImage source={dashSvg} />
        </Stack>
        <LimitInput
          currencyAtom={currencyAtom}
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
  ) : (
    <XStack ai={'center'} jc={'center'} gap={'$1'}>
      <SvgImage source={infoSvg} fill={tokens.color.white.val} />
      <Text col={'white'}>
        {t('offerForm.amountOfTransaction.pleaseSelectCurrencyFirst')}
      </Text>
    </XStack>
  )
}

export default AmountOfTransaction
