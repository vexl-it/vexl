import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {Effect} from 'effect'
import {atom, type Atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {
  createBtcPriceForCurrencyAtom,
  createBtcPricesLoadingAtom,
  createBtcPricesReadyAtom,
  createMaxAmountForCurrencyAtom,
  refreshBtcPriceWithEurEffect,
} from '../../../state/currentBtcPriceAtoms'
import calculatePriceInFiatFromSats from '../../../utils/calculatePriceInFiatFromSats'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {parseDecimalInput} from '../../../utils/normalizeDecimalInput'
import {globalDialogAtom} from '../../GlobalDialog'

export interface OfferFormPriceAtoms {
  readonly maxAmountForCurrencyAtom: Atom<number>
  readonly btcPricesLoadingAtom: Atom<boolean>
  readonly btcPricesReadyAtom: Atom<boolean>
  readonly btcPriceForOfferWithCurrencyAtom: Atom<
    BtcPriceDataWithState | undefined
  >
  readonly calculateSatsValueOnFiatValueChangeActionAtom: WritableAtom<
    null,
    [string],
    void
  >
  readonly calculateFiatValueOnSatsValueChangeActionAtom: WritableAtom<
    null,
    [string],
    void
  >
  readonly changePriceCurrencyActionAtom: WritableAtom<
    null,
    [CurrencyCode],
    void
  >
  readonly retryBtcPriceForOfferCurrencyActionAtom: WritableAtom<null, [], void>
  readonly initializeAmountTopLimitFromBtcPriceActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<void>
  >
  readonly checkAmountExceedsLimitAndShowDialogActionAtom: WritableAtom<
    null,
    [],
    Effect.Effect<boolean>
  >
}

export function createOfferFormPriceAtoms({
  currencyAtom,
  amountBottomLimitAtom,
  amountTopLimitAtom,
  satsValueAtom,
}: {
  currencyAtom: PrimitiveAtom<CurrencyCode>
  amountBottomLimitAtom: PrimitiveAtom<number>
  amountTopLimitAtom: PrimitiveAtom<number>
  satsValueAtom: PrimitiveAtom<number>
}): OfferFormPriceAtoms {
  const maxAmountForCurrencyAtom = createMaxAmountForCurrencyAtom(currencyAtom)
  const btcPricesLoadingAtom = createBtcPricesLoadingAtom(currencyAtom)
  const btcPricesReadyAtom = createBtcPricesReadyAtom(currencyAtom)
  const btcPriceForOfferWithCurrencyAtom =
    createBtcPriceForCurrencyAtom(currencyAtom)

  const showExchangeRateRequestTimedOutDialogActionAtom = atom(
    null,
    (get, set) => {
      const {t} = get(translationAtom)
      return set(globalDialogAtom, {
        title: t('offerForm.exchangeRateRequestTimedOutTitle'),
        subtitle: t('offerForm.exchangeRateRequestTimedOutDescription'),
        positiveButtonText: t('common.close'),
      })
    }
  )

  const calculateSatsValueOnFiatValueChangeActionAtom = atom(
    null,
    (get, set, priceString: string) => {
      const priceNumber = parseDecimalInput(priceString)

      if (!priceString || priceNumber === undefined) {
        set(satsValueAtom, 0)
        set(amountBottomLimitAtom, 0)
        return
      }

      const currentBtcPrice = get(btcPriceForOfferWithCurrencyAtom)?.btcPrice

      set(amountBottomLimitAtom, priceNumber)

      if (currentBtcPrice) {
        set(
          satsValueAtom,
          calculatePriceInSats({
            price: priceNumber,
            currentBtcPrice: currentBtcPrice.BTC,
          }) ?? 0
        )
      }
    }
  )

  const calculateFiatValueOnSatsValueChangeActionAtom = atom(
    null,
    (get, set, satsString: string) => {
      const satsNumber = parseDecimalInput(satsString)

      if (!satsString || satsNumber === undefined) {
        set(amountBottomLimitAtom, 0)
        set(satsValueAtom, 0)
        return
      }

      const currentBtcPrice = get(btcPriceForOfferWithCurrencyAtom)?.btcPrice

      set(satsValueAtom, satsNumber)

      if (currentBtcPrice) {
        set(
          amountBottomLimitAtom,
          calculatePriceInFiatFromSats({
            satsNumber,
            currentBtcPrice: currentBtcPrice.BTC,
          })
        )
      }
    }
  )

  const changePriceCurrencyActionAtom = atom(
    null,
    (get, set, currencyCode: CurrencyCode) => {
      set(currencyAtom, currencyCode)

      void Effect.runPromise(
        Effect.gen(function* (_) {
          const currentResult = yield* _(
            refreshBtcPriceWithEurEffect(set, currencyCode)
          )
          if (get(currencyAtom) !== currencyCode) return
          // Realign the top limit to the fresh cap once the new currency's
          // price resolves — the limit atom still holds the previous
          // currency's cap until the fetch completes.
          set(amountTopLimitAtom, get(maxAmountForCurrencyAtom))
          if (currentResult) {
            set(
              calculateFiatValueOnSatsValueChangeActionAtom,
              String(get(satsValueAtom))
            )
          } else {
            yield* _(set(showExchangeRateRequestTimedOutDialogActionAtom))
          }
        })
      )
    }
  )

  const retryBtcPriceForOfferCurrencyActionAtom = atom(null, (get, set) => {
    void Effect.runPromise(
      Effect.gen(function* (_) {
        const currency = get(currencyAtom)

        const currentResult = yield* _(
          refreshBtcPriceWithEurEffect(set, currency)
        )
        if (get(currencyAtom) !== currency) return

        set(amountTopLimitAtom, get(maxAmountForCurrencyAtom))
        if (!currentResult) {
          yield* _(set(showExchangeRateRequestTimedOutDialogActionAtom))

          return
        }

        set(
          calculateFiatValueOnSatsValueChangeActionAtom,
          String(get(satsValueAtom))
        )
      })
    )
  })

  const initializeAmountTopLimitFromBtcPriceActionAtom = atom(
    null,
    (get, set): Effect.Effect<void> => {
      const currency = get(currencyAtom)

      return Effect.gen(function* (_) {
        yield* _(refreshBtcPriceWithEurEffect(set, currency))
        set(amountTopLimitAtom, get(maxAmountForCurrencyAtom))
      })
    }
  )

  const checkAmountExceedsLimitAndShowDialogActionAtom = atom(
    null,
    (get, set): Effect.Effect<boolean> => {
      const {t} = get(translationAtom)
      const currency = get(currencyAtom)
      const amountBottomLimit = get(amountBottomLimitAtom)
      const amountTopLimit = get(amountTopLimitAtom)
      const maxAmount = get(maxAmountForCurrencyAtom)
      const locale = get(formattingLocaleAtom)

      if (amountBottomLimit <= maxAmount && amountTopLimit <= maxAmount) {
        return Effect.succeed(true)
      }

      return Effect.as(
        set(globalDialogAtom, {
          title: t('offerForm.errorExceededLimitsTitle'),
          subtitle: t('offerForm.errorExceededLimitsDescription', {
            limit: formatDecimal(maxAmount, locale, {
              maximumFractionDigits: 0,
            }),
            currency,
          }),
          positiveButtonText: t('offerForm.errorExceededLimitsButton'),
        }),
        false
      )
    }
  )

  return {
    maxAmountForCurrencyAtom,
    btcPricesLoadingAtom,
    btcPricesReadyAtom,
    btcPriceForOfferWithCurrencyAtom,
    calculateSatsValueOnFiatValueChangeActionAtom,
    calculateFiatValueOnSatsValueChangeActionAtom,
    changePriceCurrencyActionAtom,
    retryBtcPriceForOfferCurrencyActionAtom,
    initializeAmountTopLimitFromBtcPriceActionAtom,
    checkAmountExceedsLimitAndShowDialogActionAtom,
  }
}
