import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Option} from 'effect/index'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Text, XStack, YStack, getTokens, type TextProps} from 'tamagui'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../state/currentBtcPriceAtoms'
import {
  getCurrentLocale,
  useTranslation,
} from '../utils/localization/I18nProvider'
import {currencies} from '../utils/localization/currency'
import {localizedDateTimeActionAtom} from '../utils/localization/localizedNumbersAtoms'
import {preferencesAtom} from '../utils/preferences'
import VexlActivityIndicator from './LoadingOverlayProvider/VexlActivityIndicator'

interface Props extends TextProps {
  customBtcPriceAtom?: PrimitiveAtom<number> | undefined
  currencyAtom: Atom<CurrencyCode | undefined>
  disabled?: boolean
  postRefreshActions?: () => void
}

const emptyAtom = atom<number | undefined>(undefined)

function CurrentBtcPrice({
  customBtcPriceAtom,
  currencyAtom,
  disabled,
  postRefreshActions,
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

  const preferences = useAtomValue(preferencesAtom)
  const currentLocale = preferences.appLanguage ?? getCurrentLocale()

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

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => {
        void refreshBtcPrice(currency)().then(postRefreshActions)
      }}
    >
      <XStack ai="center">
        {btcPriceWithState?.state === 'loading' ? (
          <VexlActivityIndicator
            size="small"
            bc={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <YStack>
            <Text fos={16} ff="$body500" col="$white" {...props}>
              {`1 BTC = ${
                customBtcPrice
                  ? customBtcPrice.toLocaleString(currentLocale)
                  : btcPriceWithState?.state === 'error'
                    ? '-'
                    : btcPriceWithState?.btcPrice.BTC.toLocaleString(
                        currentLocale
                      )
              } ${currency}`}
            </Text>
            {!!lastUpdatedAtFormattedValue && (
              <Text fos={12}>
                {t('common.lastUpdated')}: {lastUpdatedAtFormattedValue}
              </Text>
            )}
          </YStack>
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
