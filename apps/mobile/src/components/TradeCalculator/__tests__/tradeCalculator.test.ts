import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {Schema} from 'effect'
import {
  calculateBtcFromFiat,
  calculateFiatFromBtc,
  changeBtcInput,
  changeBtcUnit,
  changeFee,
  formatSavedBtcAmountFromBtcUnit,
  normalizeInputString,
  recalculateOppositeSide,
  type CalculatorState,
} from '../helpers'

const baseState: CalculatorState = {
  btcInput: '',
  fiatInput: '',
  btcUnit: 'BTC',
  fiatCurrency: Schema.decodeSync(CurrencyCode)('USD'),
  feeAmount: 0,
  premiumOrDiscountEnabled: false,
  inputsSwapped: false,
  priceSource: 'live',
  fixedBtcPrice: undefined,
  manualPriceInput: undefined,
  lastEditedSide: 'btc',
}

const liveUsdBtcPrice = 100_000

describe('TradeCalculator domain transitions', () => {
  test('normalizes editable input without storing thousands separators', () => {
    expect(normalizeInputString('100 000')).toBe('100000')
    expect(normalizeInputString('1,25')).toBe('1.25')
  })

  test('BTC input updates fiat and clearing BTC clears fiat', () => {
    const withBtc = changeBtcInput(baseState, '0.5', liveUsdBtcPrice)

    expect(withBtc.btcInput).toBe('0.5')
    expect(withBtc.fiatInput).toBe('50000')

    expect(changeBtcInput(withBtc, '', liveUsdBtcPrice).fiatInput).toBe('')
  })

  test('fiat input updates BTC and clearing fiat clears BTC', () => {
    const withFiat: CalculatorState = {
      ...baseState,
      fiatInput: '25000',
      lastEditedSide: 'fiat',
    }

    expect(calculateBtcFromFiat(withFiat, liveUsdBtcPrice)).toBe('0.25')
    expect(
      calculateBtcFromFiat({...withFiat, fiatInput: ''}, liveUsdBtcPrice)
    ).toBe('')
  })

  test('BTC/SAT toggle preserves economic value', () => {
    const satState = changeBtcUnit(
      {
        ...baseState,
        btcInput: '0.001',
      },
      liveUsdBtcPrice
    )

    expect(satState.btcUnit).toBe('SAT')
    expect(satState.btcInput).toBe('100000')
    expect(satState.fiatInput).toBe('100')

    const btcState = changeBtcUnit(satState, liveUsdBtcPrice)

    expect(btcState.btcUnit).toBe('BTC')
    expect(btcState.btcInput).toBe('0.001')
  })

  test('fee change preserves fee-free fiat amount and reapplies new fee', () => {
    const stateWithTenPercentFee = {
      ...baseState,
      fiatInput: '110',
      feeAmount: 10,
    }

    expect(changeFee(stateWithTenPercentFee, 20).fiatInput).toBe('120')
  })

  test('live refresh recalculates live source but keeps fixed custom price stable', () => {
    const liveState: CalculatorState = {
      ...baseState,
      btcInput: '1',
      priceSource: 'live',
    }
    const customState: CalculatorState = {
      ...liveState,
      priceSource: 'custom',
      fixedBtcPrice: 90_000,
    }

    expect(recalculateOppositeSide(liveState, 110_000).fiatInput).toBe('110000')
    expect(recalculateOppositeSide(customState, 110_000).fiatInput).toBe(
      '90000'
    )
  })

  test('saving SAT input stores BTC amount numerically', () => {
    expect(formatSavedBtcAmountFromBtcUnit('100 000', 'SAT')).toBe(0.001)
  })

  test('manual price uses fixed price instead of live market price', () => {
    const ownPriceState: CalculatorState = {
      ...baseState,
      btcInput: '1',
      priceSource: 'your',
      fixedBtcPrice: 90_000,
      fiatCurrency: Schema.decodeSync(CurrencyCode)('USD'),
    }

    expect(calculateFiatFromBtc(ownPriceState, 100_000)).toBe('90000')
  })
})
