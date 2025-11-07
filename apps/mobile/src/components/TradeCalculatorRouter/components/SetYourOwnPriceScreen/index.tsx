import {useNavigation} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'
import {Stack} from 'tamagui'
import {type TradeCalculatorStackScreenProps} from '../../../../navigationTypes'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import {
  ownPriceSaveButtonDisabledAtom,
  saveYourPriceActionAtom,
} from '../../../TradeCalculator/atoms'
import SetYourOwnPrice from '../../../TradeCalculator/components/SetYourOwnPrice'

function SetYourOwnPriceScreen(): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<
      TradeCalculatorStackScreenProps<'SetYourOwnPrice'>['navigation']
    >()

  const ownPriceSaveButtonDisabled = useAtomValue(
    ownPriceSaveButtonDisabledAtom
  )
  const saveYourPrice = useSetAtom(saveYourPriceActionAtom)

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
      />
      <Stack f={1} bc="$black" pb="$1">
        <ScrollView showsVerticalScrollIndicator={false}>
          <SetYourOwnPrice />
        </ScrollView>
      </Stack>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        disabled={ownPriceSaveButtonDisabled}
        onPress={() => {
          void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
            saveYourPrice()
            navigation.goBack()
          })
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default SetYourOwnPriceScreen
