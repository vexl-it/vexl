import {useFocusEffect} from '@react-navigation/native'
import {pipe} from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {ActivityIndicator, Linking, TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {
  btcPriceForSelectedCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {selectedCurrencyAtom} from '../../../state/selectedCurrency'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../../utils/preferences'
import {AnimatedLiveIndicator} from '../../AnimatedLiveIndicator'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'

function BitcoinPriceChart(): JSX.Element {
  const preferences = useAtomValue(preferencesAtom)
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  const btcPriceForSelectedCurrency = useAtomValue(
    btcPriceForSelectedCurrencyAtom
  )
  const askAreYouSureAction = useSetAtom(askAreYouSureActionAtom)

  const {t} = useTranslation()

  useFocusEffect(
    useCallback(() => {
      void refreshBtcPrice(selectedCurrency)()
    }, [refreshBtcPrice, selectedCurrency])
  )

  return (
    <Stack h="100%">
      <Stack f={1} />
      <XStack jc="space-between" alignItems="center" px="$6" py="$1">
        <Stack />
        <TouchableOpacity
          onPress={() => {
            void refreshBtcPrice(selectedCurrencyAtom)()
            void pipe(
              askAreYouSureAction({
                variant: 'info',
                steps: [
                  {
                    type: 'StepWithText',
                    title: t('btcPricePopup.titleRate'),
                    description: t('btcPricePopup.description'),
                    positiveButtonText: t('common.learnMore'),
                    negativeButtonText: t('common.close'),
                  },
                ],
              }),
              TE.match(
                () => {},
                () => {
                  void Linking.openURL(t('btcPricePopup.url'))
                }
              )
            )()
          }}
        >
          <XStack>
            {btcPriceForSelectedCurrency?.state === 'success' && (
              <Stack justifyContent="center" mr="$1">
                <AnimatedLiveIndicator color="$yellowAccent1" />
              </Stack>
            )}
            {btcPriceForSelectedCurrency?.state === 'loading' ? (
              <XStack space="$2" mr="$2">
                <ActivityIndicator
                  size="small"
                  color={getTokens().color.main.val}
                />
                {!!btcPriceForSelectedCurrency.btcPrice && (
                  <Text fos={20} ff="$heading" color="$yellowAccent1">
                    {btcPriceForSelectedCurrency.btcPrice}
                  </Text>
                )}
              </XStack>
            ) : (
              <Text fos={20} ff="$heading" color="$yellowAccent1">
                {btcPriceForSelectedCurrency?.state === 'error'
                  ? '-'
                  : btcPriceForSelectedCurrency?.btcPrice.toLocaleString(
                      preferences.appLanguage ?? getCurrentLocale()
                    )}
              </Text>
            )}
            <Text fos={12} ff="$body700" color="$yellowAccent1">
              {selectedCurrency}
            </Text>
          </XStack>
        </TouchableOpacity>
      </XStack>
    </Stack>
  )
}

export default BitcoinPriceChart
