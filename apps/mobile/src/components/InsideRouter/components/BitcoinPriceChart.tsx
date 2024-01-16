import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {useAtomValue, useSetAtom} from 'jotai'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'
import {selectedCurrencyAtom} from '../../../state/selectedCurrency'
import {
  btcPriceForSelectedCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'

export const CHART_HEIGHT_PX = 100

function BitcoinPriceChart(): JSX.Element {
  const insets = useSafeAreaInsets()
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  const btcPriceForSelectedCurrency = useAtomValue(
    btcPriceForSelectedCurrencyAtom
  )

  useFocusEffect(
    useCallback(() => {
      void refreshBtcPrice(selectedCurrency)()
    }, [refreshBtcPrice, selectedCurrency])
  )

  return (
    <Stack h={CHART_HEIGHT_PX}>
      <Stack f={1} pt={insets.top} />
      <XStack jc={'space-between'} alignItems={'center'} px={'$6'} py={'$2'}>
        <Stack />
        <TouchableOpacity
          onPress={() => {
            void refreshBtcPrice(selectedCurrency)()
          }}
        >
          <XStack>
            {btcPriceForSelectedCurrency.state === 'loading' ? (
              <Stack mr={'$2'}>
                <ActivityIndicator
                  size={'small'}
                  color={getTokens().color.main.val}
                />
              </Stack>
            ) : (
              <Text fos={28} ff={'$heading'} color={'$yellowAccent1'}>
                {btcPriceForSelectedCurrency.state === 'error'
                  ? '- '
                  : btcPriceForSelectedCurrency.btcPrice}
              </Text>
            )}
            <Text fos={12} ff={'$body700'} color={'$yellowAccent1'}>
              {selectedCurrency}
            </Text>
          </XStack>
        </TouchableOpacity>
      </XStack>
    </Stack>
  )
}

export default BitcoinPriceChart
