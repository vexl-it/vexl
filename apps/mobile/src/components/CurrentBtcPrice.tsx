import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Loader, Typography, XStack, useTheme} from '@vexl-next/ui'
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
import {currencies} from '../utils/localization/currency'
import {formatDecimal} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'

interface Props {
  readonly customBtcPriceAtom?: PrimitiveAtom<number> | undefined
  readonly currencyAtom: Atom<CurrencyCode | undefined>
  readonly onPress?: () => void
  readonly postRefreshActions?: () => void
  readonly trailingElement?: React.ReactNode
}

const emptyAtom = atom<number | undefined>(undefined)

function CurrentBtcPrice({
  customBtcPriceAtom,
  currencyAtom,
  onPress,
  postRefreshActions,
  trailingElement,
}: Props): React.ReactElement {
  const theme = useTheme()
  const currency = useAtomValue(currencyAtom) ?? currencies.USD.code
  const customBtcPrice = useAtomValue(customBtcPriceAtom ?? emptyAtom)
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPriceWithState = useAtomValue(
    useMemo(() => createBtcPriceForCurrencyAtom(currency), [currency])
  )
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

  const formattedPrice = customBtcPrice
    ? formatDecimal(customBtcPrice, currentLocale, {maximumFractionDigits: 0})
    : btcPriceWithState?.state === 'error'
      ? '-'
      : formatDecimal(btcPriceWithState?.btcPrice?.BTC ?? 0, currentLocale, {
          maximumFractionDigits: 0,
        })

  return (
    <XStack
      ai="center"
      gap="$2"
      disabled={!onPress}
      onPress={onPress}
      pressStyle={{opacity: 0.7}}
    >
      {btcPriceWithState?.state === 'loading' ? (
        <Loader size="small" color={theme.foregroundSecondary.get()} />
      ) : (
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          textAlign="right"
        >
          {`1 BTC = ${formattedPrice} ${currency}`}
        </Typography>
      )}
      {trailingElement}
    </XStack>
  )
}

export default CurrentBtcPrice
