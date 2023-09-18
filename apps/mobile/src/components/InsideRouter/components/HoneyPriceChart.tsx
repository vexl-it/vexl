import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, XStack} from 'tamagui'
import {TouchableOpacity} from 'react-native'
import {useAtomValue, useSetAtom} from 'jotai'
import {honeyPriceAtom, refreshHoneyPriceActionAtom} from '../atoms'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useMemo} from 'react'
import formatNumber from '../../../utils/formatNumber'
import {selectedCurrencyAtom} from '../../../state/selectedCurrency'

export const CHART_HEIGHT_PX = 100

function HoneyPriceChart(): JSX.Element {
  const insets = useSafeAreaInsets()
  const refreshHoneyPrice = useSetAtom(refreshHoneyPriceActionAtom)
  const honeyPrice = useAtomValue(honeyPriceAtom)
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  const honeyPriceValue = useMemo(
    () =>
      formatNumber(
        selectedCurrency === 'USD'
          ? honeyPrice?.priceUsd
          : selectedCurrency === 'EUR'
          ? honeyPrice?.priceEur
          : honeyPrice?.priceCzk
      ),
    [
      honeyPrice?.priceCzk,
      honeyPrice?.priceEur,
      honeyPrice?.priceUsd,
      selectedCurrency,
    ]
  )

  useFocusEffect(
    useCallback(() => {
      void refreshHoneyPrice()()
    }, [refreshHoneyPrice])
  )

  return (
    <Stack h={CHART_HEIGHT_PX}>
      <Stack f={1} pt={insets.top} />
      <XStack jc={'space-between'} alignItems={'center'} px={'$6'} py={'$2'}>
        <Stack />
        <TouchableOpacity
          onPress={() => {
            void refreshHoneyPrice()()
          }}
        >
          <XStack>
            <Text fos={28} ff={'$heading'} color={'$yellowAccent1'}>
              {honeyPriceValue ?? '- '}
            </Text>
            <Text fos={12} ff={'$body700'} color={'$yellowAccent1'}>
              {selectedCurrency}
            </Text>
          </XStack>
        </TouchableOpacity>
      </XStack>
    </Stack>
  )
}

export default HoneyPriceChart
