import React from 'react'
import {ScrollView} from 'react-native'
import {Stack} from 'tamagui'
import {type TradeCalculatorStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import TradeCalculator from '../../../TradeCalculator/components/TradeCalculator'

type Props = TradeCalculatorStackScreenProps<'TradeCalculator'>

function TradeCalculatorScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  return (
    <>
      <HeaderProxy title={t('tradeCalculator.title')} />
      <Stack f={1} bc="$black" pb="$1">
        <ScrollView showsVerticalScrollIndicator={false}>
          <TradeCalculator
            onPremiumOrDiscountPress={() => {
              navigation.navigate('PremiumOrDiscount')
            }}
          />
        </ScrollView>
      </Stack>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy onPress={goBack} text={t('common.close')} />
    </>
  )
}

export default TradeCalculatorScreen
