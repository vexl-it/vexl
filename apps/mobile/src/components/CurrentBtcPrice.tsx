import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Loader} from '@vexl-next/ui'
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
import {Text, XStack, YStack, useTheme, type TextProps} from 'tamagui'
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

interface Props extends TextProps {
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
  const theme = useTheme()
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

  const pressDisabled = Boolean(disabled) && !onPricePress

  return (
    <TouchableOpacity
      disabled={pressDisabled}
      activeOpacity={pressDisabled ? 1 : 0.7}
      onPress={() => {
        if (onPricePress) {
          onPricePress()
          return
        }

        void refreshBtcPrice(currency)().then(postRefreshActions)
      }}
    >
      <XStack ai="center" gap="$2">
        {btcPriceWithState?.state === 'loading' ? (
          <Loader size="small" color={theme.foregroundSecondary.get()} />
        ) : (
          <YStack>
            <Text fos={16} ff="$body500" col="$foregroundPrimary" {...props}>
              {`1 BTC = ${
                customBtcPrice
                  ? customBtcPrice.toLocaleString(currentLocale, {
                      maximumFractionDigits: 0,
                    })
                  : btcPriceWithState?.state === 'error'
                    ? '-'
                    : btcPriceWithState?.btcPrice.BTC.toLocaleString(
                        currentLocale,
                        {maximumFractionDigits: 0}
                      )
              } ${currency}`}
            </Text>
            {showLastUpdatedAt && lastUpdatedAtFormattedValue !== null ? (
              <Text fos={12} col="$foregroundTertiary">
                {t('common.lastUpdated')}: {lastUpdatedAtFormattedValue}
              </Text>
            ) : null}
          </YStack>
        )}
        {trailingElement}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
