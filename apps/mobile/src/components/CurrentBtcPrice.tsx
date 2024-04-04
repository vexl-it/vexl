import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
} from 'jotai'
import {useMemo} from 'react'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {Text, XStack, getTokens, type TextProps} from 'tamagui'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../state/currentBtcPriceAtoms'
import {getCurrentLocale} from '../utils/localization/I18nProvider'
import {currencies} from '../utils/localization/currency'
import {preferencesAtom} from '../utils/preferences'

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

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => {
        void refreshBtcPrice(currency)().then(postRefreshActions)
      }}
    >
      <XStack ai="center">
        {btcPriceWithState?.state === 'loading' ? (
          <ActivityIndicator
            size="small"
            color={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <Text fos={16} ff="$body500" col="$greyOnBlack" {...props}>
            {`1 BTC = ${
              customBtcPrice
                ? customBtcPrice.toLocaleString(currentLocale)
                : btcPriceWithState?.state === 'error'
                ? '-'
                : btcPriceWithState?.btcPrice.toLocaleString(currentLocale)
            } ${currency}`}
          </Text>
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrentBtcPrice
