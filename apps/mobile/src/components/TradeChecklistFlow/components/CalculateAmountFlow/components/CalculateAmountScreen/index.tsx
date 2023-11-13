import Content from '../../../Content'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {Stack, XStack} from 'tamagui'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'
import {
  btcInputValueAtom,
  fiatInputValueAtom,
  refreshCurrentBtcPriceActionAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
  syncCalculatedAmountDataStateWithMainStateActionAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import CurrentBtcPrice from '../CurrentBtcPrice'
import {useCallback, useEffect} from 'react'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import BtcAmountInput from '../../components/BtcAmountInput'
import FiatAmountInput from '../../components/FiatAmountInput'
import {useFocusEffect} from '@react-navigation/native'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'

function CalculateAmountScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const refreshCurrentBtcPrice = useSetAtom(refreshCurrentBtcPriceActionAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const syncCalculatedAmountDataStateWithMainState = useSetAtom(
    syncCalculatedAmountDataStateWithMainStateActionAtom
  )
  const saveLocalCalculatedAmountDataStateToMainState = useSetAtom(
    saveLocalCalculatedAmountDataStateToMainStateActionAtom
  )

  useEffect(() => {
    syncCalculatedAmountDataStateWithMainState()
  }, [syncCalculatedAmountDataStateWithMainState])

  useFocusEffect(
    useCallback(() => {
      if (tradePriceType === 'live') {
        void refreshCurrentBtcPrice()()
      }
    }, [refreshCurrentBtcPrice, tradePriceType])
  )

  return (
    <>
      <HeaderProxy
        onClose={goBack}
        title={t('tradeChecklist.calculateAmount.calculateAmount')}
      />
      <Content scrollable>
        <Stack space={'$4'}>
          <XStack ai={'center'} jc={'space-between'}>
            <SwitchTradePriceTypeButton
              onPress={() => {
                setTradePriceTypeDialogVisible(true)
              }}
            />
            <CurrentBtcPrice />
          </XStack>
          <Stack space={'$2'}>
            <BtcAmountInput
              btcValueAtom={btcInputValueAtom}
              fiatValueAtom={fiatInputValueAtom}
            />
            <FiatAmountInput
              showSubtitle
              btcValueAtom={btcInputValueAtom}
              fiatValueAtom={fiatInputValueAtom}
            />
          </Stack>
          <PremiumOrDiscount />
        </Stack>
      </Content>
      <FooterButtonProxy
        disabled={saveButtonDisabled}
        onPress={() => {
          void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
            saveLocalCalculatedAmountDataStateToMainState()
            goBack()
          })
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default CalculateAmountScreen
