import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
const DECIMALS_FOR_BTC_VALUE = 8
const SATOSHIS_IN_BTC = 100_000_000

function formatBtcAmount(btcAmount: number): string {
  return btcAmount.toFixed(DECIMALS_FOR_BTC_VALUE).replace(/\.?0+$/, '')
}

export type CalculatorEditedSide = 'btc' | 'fiat'

export interface CalculatorState {
  readonly btcInput: string
  readonly fiatInput: string
  readonly btcUnit: BtcOrSat
  readonly fiatCurrency: CurrencyCode | undefined
  readonly feeAmount: number
  readonly premiumOrDiscountEnabled: boolean
  readonly inputsSwapped: boolean
  readonly priceSource: TradePriceType
  readonly fixedBtcPrice: number | undefined
  readonly manualPriceInput: string | undefined
  readonly lastEditedSide: CalculatorEditedSide
}

export interface EffectiveBtcPrice {
  readonly price: number | undefined
  readonly source: TradePriceType
}

export function normalizeInputString(input: string): string {
  const normalized = input.replace(/ /g, '').replace(/,/g, '.')

  if (normalized === '') return ''

  if (Number.isNaN(Number(normalized))) return '0'

  if (
    normalized.startsWith('0') &&
    normalized !== '0' &&
    !normalized.includes('.')
  ) {
    return normalized.replace(/^0+/, '')
  }

  return normalized
}

export function parseNormalizedInput(input: string): number {
  const parsed = Number(normalizeInputString(input))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function btcToSat(btcAmount: number): string {
  return `${Math.round(btcAmount * SATOSHIS_IN_BTC)}`
}

export function satToBtc(satAmount: number): string {
  return formatBtcAmount(satAmount / SATOSHIS_IN_BTC)
}

export function formatSavedBtcAmountFromBtcUnit(
  amount: string,
  btcUnit: BtcOrSat
): number {
  const parsedAmount = parseNormalizedInput(amount)
  return btcUnit === 'SAT'
    ? Number(formatBtcAmount(parsedAmount / SATOSHIS_IN_BTC))
    : parsedAmount
}

export function amountInputToBtc(amount: string, btcUnit: BtcOrSat): number {
  const parsedAmount = parseNormalizedInput(amount)
  return btcUnit === 'SAT' ? parsedAmount / SATOSHIS_IN_BTC : parsedAmount
}

export function btcToAmountInput(btcAmount: number, btcUnit: BtcOrSat): string {
  return btcUnit === 'SAT' ? btcToSat(btcAmount) : formatBtcAmount(btcAmount)
}

export function applyFee(amount: number, feeAmount: number): number {
  return amount + amount * (feeAmount / 100)
}

export function cancelFee(amount: number, feeAmount: number): number {
  return amount / (1 + feeAmount / 100)
}

export function resolveEffectiveBtcPrice(
  state: CalculatorState,
  liveBtcPrice: number | undefined
): EffectiveBtcPrice {
  if (state.priceSource === 'live') {
    return {
      price: liveBtcPrice,
      source: state.priceSource,
    }
  }

  return {price: state.fixedBtcPrice, source: state.priceSource}
}

export function calculateFiatFromBtc(
  state: CalculatorState,
  liveBtcPrice: number | undefined
): string {
  const btcAmount = amountInputToBtc(state.btcInput, state.btcUnit)
  const effectivePrice = resolveEffectiveBtcPrice(state, liveBtcPrice).price

  if (!state.btcInput || !effectivePrice) return ''

  return `${Math.round(applyFee(btcAmount * effectivePrice, state.feeAmount))}`
}

export function calculateBtcFromFiat(
  state: CalculatorState,
  liveBtcPrice: number | undefined
): string {
  const fiatAmount = parseNormalizedInput(state.fiatInput)
  const effectivePrice = resolveEffectiveBtcPrice(state, liveBtcPrice).price

  if (!state.fiatInput || !effectivePrice) return ''

  return btcToAmountInput(
    cancelFee(fiatAmount, state.feeAmount) / effectivePrice,
    state.btcUnit
  )
}

export function recalculateOppositeSide(
  state: CalculatorState,
  liveBtcPrice: number | undefined
): CalculatorState {
  if (state.lastEditedSide === 'btc') {
    return {
      ...state,
      fiatInput: calculateFiatFromBtc(state, liveBtcPrice),
    }
  }

  return {
    ...state,
    btcInput: calculateBtcFromFiat(state, liveBtcPrice),
  }
}

export function changeBtcInput(
  state: CalculatorState,
  input: string,
  liveBtcPrice: number | undefined
): CalculatorState {
  return recalculateOppositeSide(
    {
      ...state,
      btcInput: normalizeInputString(input),
      lastEditedSide: 'btc',
    },
    liveBtcPrice
  )
}

export function changeFiatInput(
  state: CalculatorState,
  input: string,
  liveBtcPrice: number | undefined
): CalculatorState {
  return recalculateOppositeSide(
    {
      ...state,
      fiatInput: normalizeInputString(input),
      lastEditedSide: 'fiat',
    },
    liveBtcPrice
  )
}

export function changeBtcUnit(
  state: CalculatorState,
  liveBtcPrice: number | undefined
): CalculatorState {
  const btcAmount = amountInputToBtc(state.btcInput, state.btcUnit)
  const nextBtcUnit = state.btcUnit === 'BTC' ? 'SAT' : 'BTC'

  return recalculateOppositeSide(
    {
      ...state,
      btcUnit: nextBtcUnit,
      btcInput: state.btcInput ? btcToAmountInput(btcAmount, nextBtcUnit) : '',
      lastEditedSide: 'btc',
    },
    liveBtcPrice
  )
}

export function changeFee(
  state: CalculatorState,
  newFee: number
): CalculatorState {
  if (!state.fiatInput) {
    return {
      ...state,
      feeAmount: newFee,
    }
  }

  const currentFiatWithFee = parseNormalizedInput(state.fiatInput)
  const fiatWithoutPreviousFee = cancelFee(currentFiatWithFee, state.feeAmount)
  const fiatWithNewFee = applyFee(fiatWithoutPreviousFee, newFee)

  return {
    ...state,
    feeAmount: newFee,
    fiatInput: `${Math.round(fiatWithNewFee)}`,
  }
}

export function disableFee(state: CalculatorState): CalculatorState {
  return changeFee(
    {
      ...state,
      premiumOrDiscountEnabled: false,
    },
    0
  )
}
