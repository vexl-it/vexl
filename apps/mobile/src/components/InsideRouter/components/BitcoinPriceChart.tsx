import {useFocusEffect} from '@react-navigation/native'
import {unixMillisecondsToPretty} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {ActivityIndicator, Linking, TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
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
      <YStack alignItems="flex-end" px="$6" py="$1">
        <XStack jc="space-between" alignItems="center">
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
                <XStack gap="$2" mr="$2">
                  <ActivityIndicator
                    size="small"
                    color={getTokens().color.main.val}
                  />
                  {!!btcPriceForSelectedCurrency.btcPrice && (
                    <Text fos={20} ff="$heading" color="$yellowAccent1">
                      {btcPriceForSelectedCurrency.btcPrice.BTC}
                    </Text>
                  )}
                </XStack>
              ) : (
                <Text fos={20} ff="$heading" color="$yellowAccent1">
                  {btcPriceForSelectedCurrency?.state === 'error' ||
                  !btcPriceForSelectedCurrency?.btcPrice
                    ? '-'
                    : Math.round(
                        btcPriceForSelectedCurrency.btcPrice.BTC
                      ).toLocaleString(
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
        {!!btcPriceForSelectedCurrency?.btcPrice &&
          btcPriceForSelectedCurrency.btcPrice.lastUpdatedAt._tag ===
            'Some' && (
            <Text fos={12} color="$yellowAccent1">
              {t('common.lastUpdated')}:{' '}
              {unixMillisecondsToPretty(
                btcPriceForSelectedCurrency.btcPrice.lastUpdatedAt.value
              )()}
            </Text>
          )}
      </YStack>
    </Stack>
  )
}

export default BitcoinPriceChart
