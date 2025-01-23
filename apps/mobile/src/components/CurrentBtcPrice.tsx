import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {unixMillisecondsToPretty} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
} from 'jotai'
import {useEffect, useMemo} from 'react'
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
}: Props): JSX.Element {
  const currency = useAtomValue(currencyAtom) ?? currencies.USD.code
  const customBtcPrice = useAtomValue(customBtcPriceAtom ?? emptyAtom)
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPriceWithState = useAtomValue(
    useMemo(() => createBtcPriceForCurrencyAtom(currency), [currency])
  )

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
  const {t} = useTranslation()

  return (
    <TouchableOpacity
      style={{flex: 1, alignItems: 'flex-end'}}
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
            {!customBtcPrice &&
              btcPriceWithState?.btcPrice?.lastUpdatedAt?._tag === 'Some' && (
                <Text fos={12}>
                  {t('common.lastUpdated')}:{' '}
                  {unixMillisecondsToPretty(
                    btcPriceWithState.btcPrice.lastUpdatedAt.value
                  )()}
                </Text>
              )}
          </YStack>
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
