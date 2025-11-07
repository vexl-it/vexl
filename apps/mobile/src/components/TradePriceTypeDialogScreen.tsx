import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {type RootStackParamsList} from '../navigationTypes'
import {useTranslation} from '../utils/localization/I18nProvider'
import Button from './Button'
import CurrentBtcPrice from './CurrentBtcPrice'
import {
  btcPriceCurrencyAtom,
  liveTradePriceExplanationAtom,
  setFormDataBasedOnBtcPriceTypeActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from './TradeCalculator/atoms'
import PriceTypeIndicator from './TradeCalculator/components/PriceTypeIndicator'

const styles = StyleSheet.create({
  flip: {transform: [{scaleY: -1}]},
})

function TradePriceTypeDialogScreen(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation: NavigationProp<RootStackParamsList> = useNavigation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const setLiveTradePriceExplanationVisible = useSetAtom(
    liveTradePriceExplanationAtom
  )
  const setFormDataBasedOnBtcPriceType = useSetAtom(
    setFormDataBasedOnBtcPriceTypeActionAtom
  )

  return (
    <ScrollView style={styles.flip}>
      <View style={styles.flip}>
        <Stack gap="$2" mb="$4" bc="$blackAccent1">
          <Stack px="$4" br="$4" mx="$2" py="$5" bc="$white">
            <XStack ai="center" jc="space-between">
              <Stack ai="center" jc="center" br="$4" bc="$grey" px="$4" py="$2">
                <PriceTypeIndicator />
              </Stack>
              {tradePriceType === 'live' && (
                <Stack ai="flex-end">
                  <Text fos={16} ff="$body500" col="$greyOnBlack">
                    {t('tradeChecklist.calculateAmount.sourceYadio')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      void setLiveTradePriceExplanationVisible()
                    }}
                  >
                    <Text color="$greyOnBlack" textDecorationLine="underline">
                      {t('common.learnMore')}
                    </Text>
                  </TouchableOpacity>
                </Stack>
              )}
            </XStack>
            <Stack gap="$2" py="$4">
              <CurrentBtcPrice
                currencyAtom={btcPriceCurrencyAtom}
                customBtcPriceAtom={
                  tradePriceType !== 'live' ? tradeBtcPriceAtom : undefined
                }
                fos={24}
                ff="$heading"
                col="$black"
              />
              <Text fos={18} ff="$body500" col="$greyOnWhite">
                {tradePriceType === 'live'
                  ? t('tradeChecklist.calculateAmount.youAreUsingLivePrice')
                  : tradePriceType === 'your'
                    ? t('tradeChecklist.calculateAmount.youAreUsingYourPrice')
                    : t(
                        'tradeChecklist.calculateAmount.youAreUsingFrozenPrice'
                      )}
              </Text>
            </Stack>
            {tradePriceType === 'your' ? (
              <XStack f={1} gap="$2">
                <Button
                  fullSize
                  text={t('common.continue')}
                  onPress={() => {
                    navigation.goBack()
                  }}
                  variant="primary"
                />
                <Button
                  fullSize
                  text={t('common.change')}
                  onPress={() => {
                    navigation.navigate('TradeCalculatorFlow', {
                      screen: 'SetYourOwnPrice',
                    })
                  }}
                  variant="secondary"
                />
              </XStack>
            ) : (
              <Button
                text={t('common.continue')}
                onPress={() => {
                  navigation.goBack()
                }}
                variant="secondary"
              />
            )}
          </Stack>
          {tradePriceType !== 'live' && (
            <Button
              onPress={() => {
                setFormDataBasedOnBtcPriceType('live')
                navigation.goBack()
              }}
              variant="primary"
              text={t('tradeChecklist.calculateAmount.setLivePrice')}
            />
          )}
          {tradePriceType !== 'frozen' && (
            <Button
              onPress={() => {
                setFormDataBasedOnBtcPriceType('frozen')
                navigation.goBack()
              }}
              variant="primary"
              text={t(
                'tradeChecklist.calculateAmount.freezeCurrentMarketPrice'
              )}
            />
          )}
          {tradePriceType !== 'your' && (
            <Button
              onPress={() => {
                navigation.navigate('TradeCalculatorFlow', {
                  screen: 'SetYourOwnPrice',
                })
              }}
              variant="primary"
              text={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
            />
          )}
        </Stack>
      </View>
    </ScrollView>
  )
}

export default TradePriceTypeDialogScreen
