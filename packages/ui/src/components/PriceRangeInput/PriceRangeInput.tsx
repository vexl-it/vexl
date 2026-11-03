import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import type {TextInput} from 'react-native'
import {getTokens, styled, useTheme} from 'tamagui'

import {ChevronDown} from '../../icons/ChevronDown'
import {Stack, XStack, YStack} from '../../primitives'
import {FieldFrame, FieldInput} from '../Field'
import {Typography} from '../Typography'
import {RangeSlider} from './RangeSlider'

const SeparatorFrame = styled(Stack, {
  name: 'PriceRangeSeparator',
  width: '$4',
  height: '$11',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$1',
})

export interface PriceRangeInputProps {
  readonly minValueAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly maxValueAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly currency: string
  readonly onCurrencyPress: () => void
  readonly maxLimit: number
  readonly maxLabel?: string
  readonly locale?: string
}

function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value)
}

function formatIntegerForEditing(value: number): string {
  return String(value)
}

export function PriceRangeInput({
  minValueAtom,
  maxValueAtom,
  currency,
  onCurrencyPress,
  maxLimit,
  maxLabel,
  locale = 'en-US',
}: PriceRangeInputProps): React.JSX.Element {
  const [minValue, setMinValue] = useAtom(minValueAtom)
  const [maxValue, setMaxValue] = useAtom(maxValueAtom)
  const theme = useTheme()

  const maxValueAtLimit = maxLabel != null && maxValue >= maxLimit
  const [minText, setMinText] = useState(formatInteger(minValue, locale))
  const [maxText, setMaxText] = useState(
    maxValueAtLimit ? maxLabel : formatInteger(maxValue, locale)
  )
  const minInputRef = useRef<TextInput>(null)
  const maxInputRef = useRef<TextInput>(null)
  const minFocusRef = useRef(false)
  const maxFocusRef = useRef(false)

  useEffect(() => {
    if (!minFocusRef.current) {
      setMinText(formatInteger(minValue, locale))
    }
  }, [minValue, locale])

  useEffect(() => {
    if (!maxFocusRef.current) {
      setMaxText(
        maxLabel != null && maxValue >= maxLimit
          ? maxLabel
          : formatInteger(maxValue, locale)
      )
    }
  }, [maxValue, maxLimit, maxLabel, locale])

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
    setMinText(formatIntegerForEditing(minValue))
  }, [minValue])

  const handleMinBlur = useCallback(() => {
    minFocusRef.current = false
    const num = parseInt(minText, 10)
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(num, maxValue, maxLimit))
      setMinValue(clamped)
      setMinText(formatInteger(clamped, locale))
    } else {
      setMinText(formatInteger(minValue, locale))
    }
  }, [minText, minValue, maxValue, maxLimit, locale, setMinValue])

  const handleMaxFocus = useCallback(() => {
    maxFocusRef.current = true
    setMaxText(formatIntegerForEditing(maxValue))
  }, [maxValue])

  const handleMaxBlur = useCallback(() => {
    maxFocusRef.current = false
    const num = parseInt(maxText, 10)
    if (!isNaN(num)) {
      const clamped = Math.min(maxLimit, Math.max(num, minValue, 0))
      setMaxValue(clamped)
      setMaxText(
        maxLabel != null && clamped >= maxLimit
          ? maxLabel
          : formatInteger(clamped, locale)
      )
    } else {
      setMaxText(
        maxLabel != null && maxValue >= maxLimit
          ? maxLabel
          : formatInteger(maxValue, locale)
      )
    }
  }, [maxText, minValue, maxValue, maxLimit, maxLabel, locale, setMaxValue])

  const chevronColor = theme.accentHighlightPrimary.get()

  // Commit any in-flight text edit and drop focus so the slider can take over
  // cleanly — otherwise the blur handler fires later and overwrites the
  // slider's value with the pre-drag text.
  const handleSliderInteractionStart = useCallback(() => {
    minInputRef.current?.blur()
    maxInputRef.current?.blur()
  }, [])

  return (
    <YStack gap="$3">
      <XStack gap="$3">
        <FieldFrame flex={1} paddingRight="$3">
          <FieldInput
            ref={minInputRef}
            value={minText}
            onChangeText={handleMinChange}
            keyboardType="numeric"
            onFocus={handleMinFocus}
            onBlur={handleMinBlur}
            selectionColor={theme.accentYellowPrimary.get()}
          />
        </FieldFrame>
        <SeparatorFrame>
          <Typography variant="paragraph" color="$foregroundPrimary">
            -
          </Typography>
        </SeparatorFrame>
        <FieldFrame flex={1} paddingRight="$3">
          <FieldInput
            ref={maxInputRef}
            value={maxText}
            onChangeText={handleMaxChange}
            keyboardType="numeric"
            onFocus={handleMaxFocus}
            onBlur={handleMaxBlur}
            selectionColor={theme.accentYellowPrimary.get()}
          />
        </FieldFrame>
      </XStack>
      <FieldFrame pressable role="button" onPress={onCurrencyPress}>
        <Typography
          variant="paragraph"
          color="$accentHighlightPrimary"
          flex={1}
        >
          {currency}
        </Typography>
        <ChevronDown color={chevronColor} size={getTokens().size.$7.val} />
      </FieldFrame>
      <RangeSlider
        onInteractionStart={handleSliderInteractionStart}
        minValueAtom={minValueAtom}
        maxValueAtom={maxValueAtom}
        maxLimit={maxLimit}
      />
    </YStack>
  )
}
