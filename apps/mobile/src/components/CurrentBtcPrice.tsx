import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {BtcPriceLabel, type TypographyProps} from '@vexl-next/ui'
import {Option} from 'effect/index'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../state/currentBtcPriceAtoms'
import {useTranslation} from '../utils/localization/I18nProvider'
import {currencies} from '../utils/localization/currency'
import {formatDecimal} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import {localizedDateTimeActionAtom} from '../utils/localization/localizedNumbersAtoms'

interface Props extends Omit<
  TypographyProps,
  'children' | 'color' | 'variant'
> {
  customBtcPriceAtom?: PrimitiveAtom<number> | undefined
  currencyAtom: Atom<CurrencyCode | undefined>
  disabled?: boolean
  onPricePress?: () => void
  postRefreshActions?: () => void
  showLastUpdatedAt?: boolean
  trailingElement?: React.ReactNode
}

const emptyAtom = atom<number | undefined>(undefined)

function CurrentBtcPrice({
  customBtcPriceAtom,
  currencyAtom,
  disabled,
  onPricePress,
  postRefreshActions,
  showLastUpdatedAt = true,
  trailingElement,
  ...props
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const currency = useAtomValue(currencyAtom) ?? currencies.USD.code
  const customBtcPrice = useAtomValue(customBtcPriceAtom ?? emptyAtom)
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPriceWithState = useAtomValue(
    useMemo(() => createBtcPriceForCurrencyAtom(currency), [currency])
  )
  const localizedDateTime = useSetAtom(localizedDateTimeActionAtom)

  const lastUpdatedAtFormattedValue = useMemo(() => {
    if (
      !customBtcPrice &&
      btcPriceWithState?.btcPrice?.lastUpdatedAt &&
      Option.isSome(btcPriceWithState.btcPrice.lastUpdatedAt)
    ) {
      return localizedDateTime({
        unixMilliseconds: btcPriceWithState.btcPrice.lastUpdatedAt.value,
      })
    }
    return null
  }, [
    btcPriceWithState?.btcPrice?.lastUpdatedAt,
    customBtcPrice,
    localizedDateTime,
  ])

  const currentLocale = useAtomValue(formattingLocaleAtom)

  useEffect(() => {
    if (!customBtcPrice && !btcPriceWithState) {
      void refreshBtcPrice(currency)().then(postRefreshActions)
    }
  }, [
    btcPriceWithState,
    currency,
    customBtcPrice,
    postRefreshActions,
    refreshBtcPrice,
  ])

  const pressDisabled = Boolean(disabled) && !onPricePress

  return (
    <BtcPriceLabel
      {...props}
      disabled={pressDisabled}
      onPress={() => {
        if (onPricePress) {
          onPricePress()
          return
        }

        void refreshBtcPrice(currency)().then(postRefreshActions)
      }}
      loading={btcPriceWithState?.state === 'loading'}
      priceLabel={`1 BTC = ${
        customBtcPrice
          ? formatDecimal(customBtcPrice, currentLocale, {
              maximumFractionDigits: 0,
            })
          : btcPriceWithState?.state === 'error'
            ? '-'
            : formatDecimal(
                btcPriceWithState?.btcPrice?.BTC ?? 0,
                currentLocale,
                {
                  maximumFractionDigits: 0,
                }
              )
      } ${currency}`}
      lastUpdatedLabel={
        showLastUpdatedAt && lastUpdatedAtFormattedValue !== null
          ? `${t('common.lastUpdated')}: ${lastUpdatedAtFormattedValue}`
          : undefined
      }
      trailingElement={trailingElement}
    />
  )
}

export default CurrentBtcPrice
