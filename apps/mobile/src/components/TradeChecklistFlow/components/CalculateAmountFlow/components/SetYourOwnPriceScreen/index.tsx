import {useAtomValue, useSetAtom} from 'jotai'
import {Stack} from 'tamagui'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import Content from '../../../Content'
import {
  ownPriceSaveButtonDisabledAtom,
  saveYourPriceActionAtom,
} from '../../atoms'
import BtcOwnPriceInput from './components/BtcOwnPriceInput'
import FiatOwnPriceInput from './components/FiatOwnPriceInput'
import PriceInfo from './components/PriceInfo'

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
        onClose={goBack}
        title={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
      />
      <Content scrollable>
        <Stack space="$4">
          <Stack space="$2">
            <BtcOwnPriceInput />
            <FiatOwnPriceInput />
          </Stack>
          <PriceInfo />
        </Stack>
      </Content>
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
