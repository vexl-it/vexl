import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import chartSvg from '../images/chartSvg'
import {TouchableOpacity} from 'react-native'
import {useAtomValue, useSetAtom} from 'jotai'
import {btcPriceAtom, refreshBtcPriceActionAtom} from '../atoms'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useMemo} from 'react'
import formatNumber from '../../../utils/formatNumber'
import {selectedCurrencyAtom} from '../../../state/selectedCurrency'

export const CHART_HEIGHT_PX = 120

function BitcoinPriceChart(): JSX.Element {
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPrice = useAtomValue(btcPriceAtom)
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  const btcPriceValue = useMemo(
    () =>
      formatNumber(
        selectedCurrency === 'USD'
          ? btcPrice?.priceUsd
          : selectedCurrency === 'EUR'
          ? btcPrice?.priceEur
          : btcPrice?.priceCzk
      ),
    [
      btcPrice?.priceCzk,
      btcPrice?.priceEur,
      btcPrice?.priceUsd,
      selectedCurrency,
    ]
  )

  useFocusEffect(
    useCallback(() => {
      void refreshBtcPrice()()
    }, [refreshBtcPrice])
  )

  return (
    <Stack h={CHART_HEIGHT_PX}>
      <Stack f={1} pt={insets.top} />
      <XStack jc={'space-between'} alignItems={'center'} px={'$6'} py={'$2'}>
        <Image source={chartSvg} />
        <TouchableOpacity
          onPress={() => {
            void refreshBtcPrice()()
          }}
        >
          <XStack>
            <Text fos={28} ff={'$heading'} col={'$yellowAccent1'}>
              {btcPriceValue ?? '- '}
            </Text>
            <Text fos={12} ff={'$body700'} col={'$yellowAccent1'}>
              {selectedCurrency === 'USD'
                ? t('common.usd')
                : selectedCurrency === 'EUR'
                ? t('common.eur')
                : t('common.czk')}
            </Text>
          </XStack>
        </TouchableOpacity>
      </XStack>
    </Stack>
  )
}

export default BitcoinPriceChart

// linear-gradient(180deg, #FCCD6C 0%, rgba(252, 205, 108, 0) 100%);
