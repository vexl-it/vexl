import React, {useCallback, useMemo, useState} from 'react'
import {styled, useTheme} from 'tamagui'

import {ArrowsVerticalSort} from '../icons/ArrowsVerticalSort'
import {ChevronDown} from '../icons/ChevronDown'
import {Input, SizableText, Stack, XStack, YStack} from '../primitives'
import {Loader} from './Loader'

export type BtcUnit = 'BTC' | 'SATS'

export interface ExchangeProps {
  /** Raw BTC/SATS numeric string (e.g. "0.001" or "100000") */
  readonly btcValue: string
  /** Current BTC unit display */
  readonly btcUnit: BtcUnit
  /** Called when user types in the BTC/SATS input */
  readonly onBtcValueChange?: (value: string) => void
  /** Called when user toggles between BTC and SATS */
  readonly onBtcUnitChange: (unit: BtcUnit) => void
  /** Optional external handler for BTC/SATS toggle when conversion is controlled by the consumer */
  readonly onToggleBtcUnit?: () => void
  /** Whether the BTC/SATS input is editable (default true) */
  readonly btcEditable?: boolean

  /** Raw fiat numeric string (e.g. "1234.56") */
  readonly fiatValue: string
  /** Fiat currency code (e.g. "CZK", "USD") */
  readonly fiatCurrency: string
  /** Called when user types in the fiat input */
  readonly onFiatValueChange: (value: string) => void
  /** Called when user taps the fiat currency label (to open currency picker) */
  readonly onFiatCurrencyPress: () => void
  /** Whether the fiat currency selector is editable (default true) */
  readonly fiatCurrencyEditable?: boolean
  /** Optional fiat input placeholder */
  readonly fiatPlaceholder?: string
  /** Whether the fiat field should show a loading indicator */
  readonly fiatLoading?: boolean
  /** Whether the fiat field should be auto-focused */
  readonly fiatAutoFocus?: boolean
  /** Called when fiat input receives focus */
  readonly onFiatFocus?: () => void
  /** Called when fiat input loses focus */
  readonly onFiatBlur?: () => void
  /** Whether fiat should render above BTC/SATS */
  readonly swapped?: boolean
  /** Called when user taps the center swap control */
  readonly onSwapPress?: () => void
  /** Whether to render the centered swap control (default true) */
  readonly showSwapControl?: boolean

  /** BCP 47 locale for Intl number formatting (default "en-US") */
  readonly locale?: string
}

const FieldFrame = styled(XStack, {
  name: 'ExchangeFieldFrame',
  alignItems: 'center',
  alignSelf: 'stretch',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  height: '$11',
  paddingHorizontal: '$5',
  paddingVertical: '$4',
  gap: '$5',
  borderWidth: 1,
  borderColor: 'transparent',

  variants: {
    highlighted: {
      true: {
        borderColor: '$accentHighlightSecondary',
      },
    },
  },
})

const FieldInput = styled(Input, {
  name: 'ExchangeFieldInput',
  unstyled: true,
  flex: 1,
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$foregroundPrimary',
  textAlign: 'right',
  padding: 0,
})

const CurrencyButton = styled(XStack, {
  name: 'ExchangeCurrencyButton',
  role: 'button',
  alignItems: 'center',
  gap: '$2',

  pressStyle: {
    opacity: 0.7,
  },
})

function formatNumber(value: string, locale: string): string {
  if (value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 20,
    useGrouping: true,
  }).format(num)
}

export function Exchange({
  btcValue,
  btcUnit,
  onBtcValueChange,
  onBtcUnitChange,
  onToggleBtcUnit,
  btcEditable = true,
  fiatValue,
  fiatCurrency,
  onFiatValueChange,
  onFiatCurrencyPress,
  fiatCurrencyEditable = true,
  fiatPlaceholder = '0.00',
  fiatLoading,
  fiatAutoFocus = false,
  onFiatFocus,
  onFiatBlur,
  swapped = false,
  onSwapPress,
  showSwapControl = true,
  locale = 'en-US',
}: ExchangeProps): React.JSX.Element {
  const theme = useTheme()
  const [btcFocused, setBtcFocused] = useState(false)
  const [fiatFocused, setFiatFocused] = useState(false)

  const arrowsIconColor = theme.black100.get()

  const toggleBtcUnit = useCallback(() => {
    if (onToggleBtcUnit) {
      onToggleBtcUnit()
      return
    }

    const newUnit = btcUnit === 'BTC' ? 'SATS' : 'BTC'

    if (btcValue !== '' && onBtcValueChange) {
      const num = Number(btcValue)
      if (!Number.isNaN(num)) {
        const converted =
          newUnit === 'SATS'
            ? Math.round(num * 100_000_000).toString()
            : (num / 100_000_000).toString()
        onBtcValueChange(converted)
      }
    }

    onBtcUnitChange(newUnit)
  }, [btcUnit, btcValue, onBtcValueChange, onBtcUnitChange, onToggleBtcUnit])

  const btcDisplayValue = useMemo(
    () => (btcFocused ? btcValue : formatNumber(btcValue, locale)),
    [btcFocused, btcValue, locale]
  )

  const fiatDisplayValue = useMemo(
    () => (fiatFocused ? fiatValue : formatNumber(fiatValue, locale)),
    [fiatFocused, fiatValue, locale]
  )

  const handleBtcFocus = useCallback(() => {
    setBtcFocused(true)
  }, [])

  const handleBtcBlur = useCallback(() => {
    setBtcFocused(false)
  }, [])

  const handleFiatFocus = useCallback(() => {
    setFiatFocused(true)
    onFiatFocus?.()
  }, [onFiatFocus])

  const handleFiatBlur = useCallback(() => {
    setFiatFocused(false)
    onFiatBlur?.()
  }, [onFiatBlur])

  const btcField = (
    <FieldFrame highlighted={(btcFocused && btcEditable) || undefined}>
      {btcEditable ? (
        <CurrencyButton onPress={toggleBtcUnit}>
          <SizableText
            fontFamily="$body"
            fontSize="$4"
            fontWeight="500"
            color="$foregroundPrimary"
          >
            {btcUnit}
          </SizableText>
          <ChevronDown size={24} color={theme.foregroundPrimary.get()} />
        </CurrencyButton>
      ) : (
        <SizableText
          fontFamily="$body"
          fontSize="$4"
          fontWeight="500"
          color="$foregroundPrimary"
        >
          BTC
        </SizableText>
      )}
      {btcEditable ? (
        <FieldInput
          value={btcDisplayValue}
          onChangeText={onBtcValueChange}
          placeholder="0.00"
          placeholderTextColor={theme.foregroundTertiary.get()}
          selectionColor={theme.accentYellowPrimary.get()}
          keyboardType={btcUnit === 'SATS' ? 'number-pad' : 'decimal-pad'}
          onFocus={handleBtcFocus}
          onBlur={handleBtcBlur}
        />
      ) : (
        <SizableText
          flex={1}
          fontFamily="$body"
          fontSize="$4"
          fontWeight="500"
          color="$foregroundTertiary"
          textAlign="right"
        >
          {btcDisplayValue || '0.00'}
        </SizableText>
      )}
    </FieldFrame>
  )

  const fiatField = (
    <FieldFrame highlighted={fiatFocused || undefined}>
      <CurrencyButton
        onPress={fiatCurrencyEditable ? onFiatCurrencyPress : undefined}
        role={fiatCurrencyEditable ? 'button' : undefined}
      >
        <SizableText
          fontFamily="$body"
          fontSize="$4"
          fontWeight="500"
          color="$foregroundPrimary"
        >
          {fiatCurrency}
        </SizableText>
        {fiatCurrencyEditable ? (
          <ChevronDown size={24} color={theme.foregroundPrimary.get()} />
        ) : null}
      </CurrencyButton>
      {fiatLoading ? (
        <Stack flex={1} alignItems="flex-end">
          <Loader size="small" color={theme.foregroundTertiary.get()} />
        </Stack>
      ) : (
        <FieldInput
          autoFocus={fiatAutoFocus}
          value={fiatDisplayValue}
          onChangeText={onFiatValueChange}
          placeholder={fiatPlaceholder}
          placeholderTextColor={theme.foregroundTertiary.get()}
          selectionColor={theme.accentYellowPrimary.get()}
          keyboardType="decimal-pad"
          onFocus={handleFiatFocus}
          onBlur={handleFiatBlur}
        />
      )}
    </FieldFrame>
  )

  return (
    <Stack position="relative" alignSelf="stretch">
      <YStack gap="$3" alignSelf="stretch">
        {swapped ? fiatField : btcField}
        {swapped ? btcField : fiatField}
      </YStack>

      {showSwapControl ? (
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          alignItems="center"
          justifyContent="center"
          pointerEvents={onSwapPress ? 'auto' : 'none'}
        >
          <Stack
            width="$10"
            height="$10"
            borderRadius="$3"
            backgroundColor="$accentYellowPrimary"
            alignItems="center"
            justifyContent="center"
            role={onSwapPress ? 'button' : undefined}
            onPress={onSwapPress}
          >
            <ArrowsVerticalSort size={24} color={arrowsIconColor} />
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  )
}
