import {useAtomValue, useSetAtom} from 'jotai'
import {ScrollView} from 'react-native'
import {Stack} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
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

function SetYourOwnPriceScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

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
            goBack()
          })
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default SetYourOwnPriceScreen
