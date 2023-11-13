import React from 'react'
import AnimatedDialogWrapper from '../../../../AnimatedDialogWrapper'
import {Stack, Text, XStack} from 'tamagui'
import Button from '../../../../Button'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import PriceTypeIndicator from './PriceTypeIndicator'
import {
  freezePriceActionAtom,
  setLivePriceActionAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../atoms'
import {ScrollView, StyleSheet, View} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import CurrentBtcPrice from './CurrentBtcPrice'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'

const styles = StyleSheet.create({
  flip: {transform: [{scaleY: -1}]},
})

function TradePriceTypeDialog(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const [tradePriceTypeDialogVisible, setTradePriceTypeDialogVisible] = useAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const freezePrice = useSetAtom(freezePriceActionAtom)
  const setLivePrice = useSetAtom(setLivePriceActionAtom)

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
          <Stack space={'$2'} mb={'$4'} bc={'$blackAccent1'}>
            <Stack px={'$4'} br={'$4'} mx={'$2'} py="$5" bc={'$white'}>
              <XStack ai={'center'} jc={'space-between'}>
                <Stack
                  ai={'center'}
                  jc={'center'}
                  br={'$4'}
                  bc={'$grey'}
                  px={'$4'}
                  py={'$2'}
                >
                  <PriceTypeIndicator />
                </Stack>
                {tradePriceType === 'live' ? (
                  <Text fos={16} ff={'$body500'} col={'$greyOnBlack'}>
                    {t('tradeChecklist.calculateAmount.sourceCoinGecko')}
                  </Text>
                ) : (
                  <Stack />
                )}
              </XStack>
              <Stack space={'$2'} py={'$4'}>
                <CurrentBtcPrice fos={24} ff={'$heading'} col={'$black'} />
                <Text fos={18} ff={'$body500'} col={'$greyOnWhite'}>
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
                <XStack f={1} gap={'$2'}>
                  <Button
                    fullSize
                    text={t('common.continue')}
                    onPress={() => {
                      setTradePriceTypeDialogVisible(false)
                    }}
                    variant={'primary'}
                  />
                  <Button
                    fullSize
                    text={t('common.change')}
                    onPress={() => {
                      setTradePriceTypeDialogVisible(false)
                      navigation.navigate('SetYourOwnPrice')
                    }}
                    variant={'secondary'}
                  />
                </XStack>
              ) : (
                <Button
                  text={t('common.continue')}
                  onPress={() => {
                    setTradePriceTypeDialogVisible(false)
                  }}
                  variant={'secondary'}
                />
              )}
            </Stack>
            {tradePriceType !== 'live' && (
              <Button
                onPress={() => {
                  setTradePriceTypeDialogVisible(false)
                  void setLivePrice()()
                }}
                variant={'primary'}
                text={t('tradeChecklist.calculateAmount.setLivePrice')}
              />
            )}
            {tradePriceType !== 'frozen' && (
              <Button
                onPress={() => {
                  void freezePrice()()
                  setTradePriceTypeDialogVisible(false)
                }}
                variant={'primary'}
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
                variant={'primary'}
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
