import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {styled, useTheme} from 'tamagui'

import {ChevronDown} from '../../icons/ChevronDown'
import {Input, SizableText, Stack, XStack, YStack} from '../../primitives'
import {RangeSlider} from './RangeSlider'

const InputFrame = styled(XStack, {
  name: 'PriceRangeInputField',
  flex: 1,
  height: '$11',
  alignItems: 'center',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  paddingLeft: '$5',
  paddingRight: '$3',
})

const NumberInput = styled(Input, {
  name: 'PriceRangeNumberInput',
  unstyled: true,
  flex: 1,
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$foregroundPrimary',
  padding: 0,
})

const SeparatorFrame = styled(Stack, {
  name: 'PriceRangeSeparator',
  width: '$4',
  height: '$11',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$1',
})

const SeparatorText = styled(SizableText, {
  name: 'PriceRangeSeparatorText',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$foregroundPrimary',
})

const CurrencyButton = styled(XStack, {
  name: 'PriceRangeCurrencyButton',
  role: 'button',
  height: '$11',
  alignItems: 'center',
  gap: '$3',
  paddingHorizontal: '$5',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',

  pressStyle: {
    opacity: 0.7,
  },
})

const CurrencyLabel = styled(SizableText, {
  name: 'PriceRangeCurrencyLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$accentHighlightPrimary',
  flex: 1,
})

export interface PriceRangeInputProps {
  readonly minValueAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly maxValueAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly currency: string
  readonly onCurrencyPress: () => void
  readonly maxLimit: number
}

export function PriceRangeInput({
  minValueAtom,
  maxValueAtom,
  currency,
  onCurrencyPress,
  maxLimit,
}: PriceRangeInputProps): React.JSX.Element {
  const [minValue, setMinValue] = useAtom(minValueAtom)
  const [maxValue, setMaxValue] = useAtom(maxValueAtom)
  const theme = useTheme()

  const [minText, setMinText] = useState(String(minValue))
  const [maxText, setMaxText] = useState(String(maxValue))
  const minFocusRef = useRef(false)
  const maxFocusRef = useRef(false)

  useEffect(() => {
    if (!minFocusRef.current) {
      setMinText(String(minValue))
    }
  }, [minValue])

  useEffect(() => {
    if (!maxFocusRef.current) {
      setMaxText(String(maxValue))
    }
  }, [maxValue])

  useEffect(() => {
    const clampedMinValue = Math.max(0, Math.min(minValue, maxValue, maxLimit))
    const clampedMaxValue = Math.min(
      maxLimit,
      Math.max(maxValue, clampedMinValue, 0)
    )

    if (clampedMinValue !== minValue) {
      setMinValue(clampedMinValue)
    }

    if (clampedMaxValue !== maxValue) {
      setMaxValue(clampedMaxValue)
    }
  }, [minValue, maxValue, maxLimit, setMinValue, setMaxValue])

  const handleMinChange = useCallback((text: string) => {
    setMinText(text.replace(/[^0-9]/g, ''))
  }, [])

  const handleMaxChange = useCallback((text: string) => {
    setMaxText(text.replace(/[^0-9]/g, ''))
  }, [])

  const handleMinFocus = useCallback(() => {
    minFocusRef.current = true
  }, [])

  const handleMinBlur = useCallback(() => {
    minFocusRef.current = false
    const num = parseInt(minText, 10)
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(num, maxValue, maxLimit))
      setMinValue(clamped)
      setMinText(String(clamped))
    } else {
      setMinText(String(minValue))
    }
  }, [minText, minValue, maxValue, maxLimit, setMinValue])

  const handleMaxFocus = useCallback(() => {
    maxFocusRef.current = true
  }, [])

  const handleMaxBlur = useCallback(() => {
    maxFocusRef.current = false
    const num = parseInt(maxText, 10)
    if (!isNaN(num)) {
      const clamped = Math.min(maxLimit, Math.max(num, minValue, 0))
      setMaxValue(clamped)
      setMaxText(String(clamped))
    } else {
      setMaxText(String(maxValue))
    }
  }, [maxText, minValue, maxValue, maxLimit, setMaxValue])

  const chevronColor = theme.accentHighlightPrimary.val

  return (
    <YStack gap="$3">
      <XStack gap="$3">
        <InputFrame>
          <NumberInput
            value={minText}
            onChangeText={handleMinChange}
            keyboardType="numeric"
            onFocus={handleMinFocus}
            onBlur={handleMinBlur}
            selectionColor={theme.accentYellowPrimary.val}
          />
        </InputFrame>
        <SeparatorFrame>
          <SeparatorText>-</SeparatorText>
        </SeparatorFrame>
        <InputFrame>
          <NumberInput
            value={maxText}
            onChangeText={handleMaxChange}
            keyboardType="numeric"
            onFocus={handleMaxFocus}
            onBlur={handleMaxBlur}
            selectionColor={theme.accentYellowPrimary.val}
          />
        </InputFrame>
      </XStack>
      <CurrencyButton onPress={onCurrencyPress}>
        <CurrencyLabel>{currency}</CurrencyLabel>
        <ChevronDown color={chevronColor} size={24} />
      </CurrencyButton>
      <RangeSlider
        minValueAtom={minValueAtom}
        maxValueAtom={maxValueAtom}
        maxLimit={maxLimit}
      />
    </YStack>
  )
}
