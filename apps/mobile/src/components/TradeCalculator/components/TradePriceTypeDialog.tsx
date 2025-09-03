import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {type TradeChecklistStackParamsList} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import AnimatedDialogWrapper from '../../AnimatedDialogWrapper'
import Button from '../../Button'
import CurrentBtcPrice from '../../CurrentBtcPrice'
import {
  btcPriceCurrencyAtom,
  liveTradePriceExplanationAtom,
  setFormDataBasedOnBtcPriceTypeActionAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../atoms'
import PriceTypeIndicator from './PriceTypeIndicator'

const styles = StyleSheet.create({
  flip: {transform: [{scaleY: -1}]},
})

function TradePriceTypeDialog(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const setLiveTradePriceExplanationVisible = useSetAtom(
    liveTradePriceExplanationAtom
  )
  const [tradePriceTypeDialogVisible, setTradePriceTypeDialogVisible] = useAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const setFormDataBasedOnBtcPriceType = useSetAtom(
    setFormDataBasedOnBtcPriceTypeActionAtom
  )

  if (!tradePriceTypeDialogVisible) return null

  return (
    <AnimatedDialogWrapper
      onBackButtonPressed={() => {
        setTradePriceTypeDialogVisible(false)
        return true
      }}
    >
      <ScrollView style={styles.flip}>
        <View style={styles.flip}>
          <Stack gap="$2" mb="$4" bc="$blackAccent1">
            <Stack px="$4" br="$4" mx="$2" py="$5" bc="$white">
              <XStack ai="center" jc="space-between">
                <Stack
                  ai="center"
                  jc="center"
                  br="$4"
                  bc="$grey"
                  px="$4"
                  py="$2"
                >
                  <PriceTypeIndicator />
                </Stack>
                {tradePriceType === 'live' ? (
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
                ) : (
                  <Stack />
                )}
              </XStack>
              <Stack gap="$2" py="$4">
                <CurrentBtcPrice
                  currencyAtom={btcPriceCurrencyAtom}
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
                      setTradePriceTypeDialogVisible(false)
                    }}
                    variant="primary"
                  />
                  <Button
                    fullSize
                    text={t('common.change')}
                    onPress={() => {
                      setTradePriceTypeDialogVisible(false)
                      navigation.navigate('SetYourOwnPrice')
                    }}
                    variant="secondary"
                  />
                </XStack>
              ) : (
                <Button
                  text={t('common.continue')}
                  onPress={() => {
                    setTradePriceTypeDialogVisible(false)
                  }}
                  variant="secondary"
                />
              )}
            </Stack>
            {tradePriceType !== 'live' && (
              <Button
                onPress={() => {
                  setTradePriceTypeDialogVisible(false)
                  setFormDataBasedOnBtcPriceType('live')
                }}
                variant="primary"
                text={t('tradeChecklist.calculateAmount.setLivePrice')}
              />
            )}
            {tradePriceType !== 'frozen' && (
              <Button
                onPress={() => {
                  setFormDataBasedOnBtcPriceType('frozen')
                  setTradePriceTypeDialogVisible(false)
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
                  setTradePriceTypeDialogVisible(false)
                  navigation.navigate('SetYourOwnPrice')
                }}
                variant="primary"
                text={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
              />
            )}
          </Stack>
        </View>
      </ScrollView>
    </AnimatedDialogWrapper>
  )
}

export default TradePriceTypeDialog
