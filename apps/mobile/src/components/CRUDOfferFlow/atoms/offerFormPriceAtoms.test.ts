import {
  CurrencyCode,
  type CurrencyCode as CurrencyCodeType,
} from '@vexl-next/domain/src/general/currency.brand'
import {Effect, Option, Schema} from 'effect'
import {atom, createStore, type PrimitiveAtom} from 'jotai'
import {
  createOfferFormPriceAtoms,
  type OfferFormPriceAtoms,
} from './offerFormPriceAtoms'

const mockGetExchangeRate = jest.fn<
  Effect.Effect<{BTC: number; lastUpdatedAt: Option.Option<never>}, Error>,
  [{query: {currency: CurrencyCodeType}}]
>()
const mockShowDialog = jest.fn<Effect.Effect<boolean>, [{title: string}]>()

jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    apiAtom: atom({
      btcExchangeRate: {
        getExchangeRate: (input: {query: {currency: CurrencyCodeType}}) =>
          mockGetExchangeRate(input),
      },
    }),
  }
})

jest.mock('../../GlobalDialog', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    globalDialogAtom: atom(
      null,
      (_get: unknown, _set: unknown, options: {title: string}) =>
        mockShowDialog(options)
    ),
  }
})

jest.mock('../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: (key: string) => key})}
})

jest.mock('../../../utils/localization/formattingLocaleAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {formattingLocaleAtom: atom('en')}
})

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('react-native-mmkv')

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(async () => null)},
}))

const BTC_PRICES: Partial<Record<CurrencyCodeType, number>> = {
  CZK: 2_500_000,
  EUR: 100_000,
}

const rateResponses = (): void => {
  mockGetExchangeRate.mockImplementation(({query: {currency}}) => {
    const BTC = BTC_PRICES[currency]
    return BTC
      ? Effect.succeed({BTC, lastUpdatedAt: Option.none()})
      : Effect.fail(new Error('No rate'))
  })
}

// An existing offer above the 10 000 EUR fallback cap, but within the CZK one.
interface EditedOfferPriceAtoms extends OfferFormPriceAtoms {
  readonly store: ReturnType<typeof createStore>
  readonly satsValueAtom: PrimitiveAtom<number>
  readonly amountTopLimitAtom: PrimitiveAtom<number>
}

const editedCzkOffer = (): EditedOfferPriceAtoms => {
  const satsValueAtom = atom(0)
  const amountTopLimitAtom = atom(243_000)
  return {
    store: createStore(),
    satsValueAtom,
    amountTopLimitAtom,
    ...createOfferFormPriceAtoms({
      currencyAtom: atom(Schema.decodeSync(CurrencyCode)('CZK')),
      amountBottomLimitAtom: atom(25_000),
      amountTopLimitAtom,
      satsValueAtom,
    }),
  }
}

beforeEach(() => {
  mockGetExchangeRate.mockReset()
  mockShowDialog.mockReset()
  mockShowDialog.mockReturnValue(Effect.succeed(true))
})

describe('offer form price atoms without a cached rate', () => {
  it('has no max amount instead of the EUR fallback', () => {
    const {store, maxAmountForCurrencyAtom} = editedCzkOffer()

    expect(store.get(maxAmountForCurrencyAtom)).toBeUndefined()
  })

  it('loads the rates before checking the amount limit', async () => {
    rateResponses()
    const {store, checkAmountExceedsLimitAndShowDialogActionAtom} =
      editedCzkOffer()

    const valid = await Effect.runPromise(
      store.set(checkAmountExceedsLimitAndShowDialogActionAtom)
    )

    expect(valid).toBe(true)
    expect(mockShowDialog).not.toHaveBeenCalled()
  })

  it('reports the missing rate rather than an exceeded limit', async () => {
    mockGetExchangeRate.mockReturnValue(Effect.fail(new Error('Offline')))
    const {store, checkAmountExceedsLimitAndShowDialogActionAtom} =
      editedCzkOffer()

    const valid = await Effect.runPromise(
      store.set(checkAmountExceedsLimitAndShowDialogActionAtom)
    )

    expect(valid).toBe(false)
    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'offerForm.exchangeRateRequestTimedOutTitle',
      })
    )
  })

  it('loads the rate for an edited offer and keeps its limits', async () => {
    rateResponses()
    const {
      store,
      satsValueAtom,
      amountTopLimitAtom,
      maxAmountForCurrencyAtom,
      initializeSatsValueFromBtcPriceActionAtom,
    } = editedCzkOffer()

    await Effect.runPromise(
      store.set(initializeSatsValueFromBtcPriceActionAtom)
    )

    expect(store.get(maxAmountForCurrencyAtom)).toBe(250_000)
    expect(store.get(satsValueAtom)).toBe(1_000_000)
    expect(store.get(amountTopLimitAtom)).toBe(243_000)
  })
})
