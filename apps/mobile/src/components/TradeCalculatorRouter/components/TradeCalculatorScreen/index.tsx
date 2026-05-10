import {Button, ChevronLeft, NavigationBar, Screen} from '@vexl-next/ui'
import {ScrollView, Stack} from '@vexl-next/ui/src/primitives'
import React from 'react'
import {type TradeCalculatorStackScreenProps} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import TradeCalculator from '../../../TradeCalculator/components/TradeCalculator'

type Props = TradeCalculatorStackScreenProps<'TradeCalculator'>

function TradeCalculatorScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('tradeCalculator.title')}
          leftAction={{
            icon: ChevronLeft,
            onPress: goBack,
          }}
        />
      }
      footer={
        <Button onPress={goBack} variant="secondary">
          {t('common.close')}
        </Button>
      }
    >
      <ScrollView f={1} showsVerticalScrollIndicator={false}>
        <Stack pt="$3">
          <TradeCalculator
            onPremiumOrDiscountPress={() => {
              navigation.navigate('PremiumOrDiscount')
            }}
          />
        </Stack>
      </ScrollView>
    </Screen>
  )
}

export default TradeCalculatorScreen
