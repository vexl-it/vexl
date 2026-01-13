import {useFocusEffect} from '@react-navigation/native'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Linking, TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {
  btcPriceForSelectedCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  localizedDateTimeActionAtom,
  localizedPriceActionAtom,
} from '../../../utils/localization/localizedNumbersAtoms'
import {defaultCurrencyAtom} from '../../../utils/preferences'
import {AnimatedLiveIndicator} from '../../AnimatedLiveIndicator'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import VexlActivityIndicator from '../../LoadingOverlayProvider/VexlActivityIndicator'

function BitcoinPriceChart(): React.ReactElement {
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const defaultCurrency = useAtomValue(defaultCurrencyAtom)
  const btcPriceForSelectedCurrency = useAtomValue(
    btcPriceForSelectedCurrencyAtom
  )
  const askAreYouSureAction = useSetAtom(askAreYouSureActionAtom)
  const btcPriceLocalized = useSetAtom(localizedPriceActionAtom)({
    number: Math.round(btcPriceForSelectedCurrency?.btcPrice?.BTC ?? 0),
    currency: defaultCurrency,
    maximumFractionDigits: 0,
  })
  const localizedDateTime = useSetAtom(localizedDateTimeActionAtom)

  const lastUpdatedAtFormattedValue = useMemo(() => {
    if (
      !!btcPriceForSelectedCurrency?.btcPrice &&
      btcPriceForSelectedCurrency.btcPrice.lastUpdatedAt._tag === 'Some'
    ) {
      return localizedDateTime({
        unixMilliseconds:
          btcPriceForSelectedCurrency.btcPrice.lastUpdatedAt.value,
      })
    }
    return null
  }, [btcPriceForSelectedCurrency?.btcPrice, localizedDateTime])

  const {t} = useTranslation()

  useFocusEffect(
    useCallback(() => {
      void refreshBtcPrice(defaultCurrency)()
    }, [refreshBtcPrice, defaultCurrency])
  )

  return (
    <YStack fs={1} alignItems="flex-start" px="$6" py="$1">
      <XStack jc="space-between" alignItems="center">
        <TouchableOpacity
          onPress={() => {
            void refreshBtcPrice(defaultCurrency)()
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
                />
                {!!btcPriceForSelectedCurrency.btcPrice && (
                  <Text fos={20} ff="$heading" color="$yellowAccent1">
                    {btcPriceForSelectedCurrency.btcPrice.BTC}
                  </Text>
                )}
              </XStack>
            ) : (
              <Text
                als="flex-start"
                numberOfLines={1}
                adjustsFontSizeToFit
                fos={20}
                ff="$heading"
                color="$yellowAccent1"
              >
                {btcPriceForSelectedCurrency?.state === 'error' ||
                !btcPriceForSelectedCurrency?.btcPrice
                  ? '-'
                  : btcPriceLocalized}
              </Text>
            )}
          </XStack>
        </TouchableOpacity>
      </XStack>
      {!!lastUpdatedAtFormattedValue && (
        <Text
          width="100%"
          fos={10}
          numberOfLines={1}
          adjustsFontSizeToFit
          color="$yellowAccent1"
          lineBreakMode="tail"
        >
          {t('common.lastUpdated')}: {lastUpdatedAtFormattedValue}
        </Text>
      )}
    </YStack>
  )
}

export default BitcoinPriceChart
