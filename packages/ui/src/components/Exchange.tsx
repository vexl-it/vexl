import React, {useCallback, useMemo, useState} from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {ArrowsVerticalSort} from '../icons/ArrowsVerticalSort'
import {ChevronDown} from '../icons/ChevronDown'
import {Input, SizableText, Stack, XStack, YStack} from '../primitives'

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

  /** BCP 47 locale for Intl number formatting (default "en-US") */
  readonly locale?: string
}

// ---------------------------------------------------------------------------
// Styled primitives
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(value: string, locale: string): string {
  if (value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 20,
    useGrouping: true,
  }).format(num)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Exchange({
  btcValue,
  btcUnit,
  onBtcValueChange,
  onBtcUnitChange,
  btcEditable = true,
  fiatValue,
  fiatCurrency,
  onFiatValueChange,
  onFiatCurrencyPress,
  locale = 'en-US',
}: ExchangeProps): React.JSX.Element {
  const theme = useTheme()
  const [btcFocused, setBtcFocused] = useState(false)
  const [fiatFocused, setFiatFocused] = useState(false)

  const arrowsIconColor = getTokens().color.black100.val

  const toggleBtcUnit = useCallback(() => {
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
  }, [btcUnit, btcValue, onBtcValueChange, onBtcUnitChange])

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
  }, [])

  const handleFiatBlur = useCallback(() => {
    setFiatFocused(false)
  }, [])

  return (
    <Stack position="relative" alignSelf="stretch">
      <YStack gap="$3" alignSelf="stretch">
        {/* BTC / SATS field */}
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
              <ChevronDown size={24} color={theme.foregroundPrimary.val} />
            </CurrencyButton>
          ) : (
            <SizableText
              fontFamily="$body"
              fontSize="$4"
              fontWeight="500"
              color="$foregroundTertiary"
            >
              BTC
            </SizableText>
          )}
          {btcEditable ? (
            <FieldInput
              value={btcDisplayValue}
              onChangeText={onBtcValueChange}
              placeholder="0.00"
              placeholderTextColor={theme.foregroundTertiary.val}
              selectionColor={theme.accentYellowPrimary.val}
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
              1
            </SizableText>
          )}
        </FieldFrame>

        {/* Fiat field */}
        <FieldFrame highlighted={fiatFocused || undefined}>
          <CurrencyButton onPress={onFiatCurrencyPress}>
            <SizableText
              fontFamily="$body"
              fontSize="$4"
              fontWeight="500"
              color="$foregroundPrimary"
            >
              {fiatCurrency}
            </SizableText>
            <ChevronDown size={24} color={theme.foregroundPrimary.val} />
          </CurrencyButton>
          <FieldInput
            value={fiatDisplayValue}
            onChangeText={onFiatValueChange}
            placeholder="0.00"
            placeholderTextColor={theme.foregroundTertiary.val}
            selectionColor={theme.accentYellowPrimary.val}
            keyboardType="decimal-pad"
            onFocus={handleFiatFocus}
            onBlur={handleFiatBlur}
          />
        </FieldFrame>
      </YStack>

      {/* Center arrows badge — decorative, non-interactive */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Stack
          width="$10"
          height="$10"
          borderRadius="$3"
          backgroundColor="$accentYellowPrimary"
          alignItems="center"
          justifyContent="center"
        >
          <ArrowsVerticalSort size={24} color={arrowsIconColor} />
        </Stack>
      </Stack>
    </Stack>
  )
}
