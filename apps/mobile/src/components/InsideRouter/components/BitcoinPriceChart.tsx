import {useFocusEffect} from '@react-navigation/native'
import {unixMillisecondsToPretty} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Linking, TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {
  btcPriceForSelectedCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {selectedCurrencyAtom} from '../../../state/selectedCurrency'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedPriceActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import {AnimatedLiveIndicator} from '../../AnimatedLiveIndicator'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import VexlActivityIndicator from '../../LoadingOverlayProvider/VexlActivityIndicator'

function BitcoinPriceChart(): JSX.Element {
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  const btcPriceForSelectedCurrency = useAtomValue(
    btcPriceForSelectedCurrencyAtom
  )
  const askAreYouSureAction = useSetAtom(askAreYouSureActionAtom)
  const btcPriceLocalized = useSetAtom(localizedPriceActionAtom)({
    number: Math.round(btcPriceForSelectedCurrency?.btcPrice?.BTC ?? 0),
    currency: selectedCurrency,
    maximumFractionDigits: 0,
  })

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
                effectToTaskEither,
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
                  <VexlActivityIndicator
                    size="small"
                    bc={getTokens().color.main.val}
                    mb="$2"
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
                    : btcPriceLocalized}
                </Text>
              )}
            </XStack>
          </TouchableOpacity>
        </XStack>
        {!!btcPriceForSelectedCurrency?.btcPrice &&
          btcPriceForSelectedCurrency.btcPrice.lastUpdatedAt._tag ===
            'Some' && (
            <Text
              width="100%"
              fos={10}
              numberOfLines={1}
              adjustsFontSizeToFit
              color="$yellowAccent1"
              lineBreakMode="tail"
            >
              {t('common.lastUpdated')}:{' '}
              {unixMillisecondsToPretty(
                btcPriceForSelectedCurrency.btcPrice.lastUpdatedAt.value
              )('L LT')}
            </Text>
          )}
      </YStack>
    </Stack>
  )
}

export default BitcoinPriceChart
