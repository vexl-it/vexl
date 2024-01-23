import {useFocusEffect} from '@react-navigation/native'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
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
import {saveYourPriceActionAtom, tradePriceTypeAtom} from '../../atoms'
import BtcAmountInput from '../BtcAmountInput'
import FiatAmountInput from '../FiatAmountInput'
import PriceInfo from './components/PriceInfo'

const btcTempValueAtom = atom<string>('1')
const fiatTempValueAtom = atom<string>('')
const saveButtonDisabledAtom = atom((get) => {
  const fiatTempValue = get(fiatTempValueAtom)

  return !fiatTempValue
})

function SetYourOwnPriceScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const saveYourPrice = useSetAtom(saveYourPriceActionAtom)
  const setFiatTempValue = useSetAtom(fiatTempValueAtom)

  useFocusEffect(
    useCallback(() => {
      if (tradePriceType !== 'your') {
        setFiatTempValue('')
      }
    }, [setFiatTempValue, tradePriceType])
  )

  return (
    <>
      <HeaderProxy
        onClose={goBack}
        title={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
      />
      <Content scrollable>
        <Stack space="$4">
          <Stack space="$2">
            <BtcAmountInput
              automaticCalculationDisabled
              btcValueAtom={btcTempValueAtom}
              editable={false}
              fiatValueAtom={fiatTempValueAtom}
            />
            <FiatAmountInput
              automaticCalculationDisabled
              btcValueAtom={btcTempValueAtom}
              fiatValueAtom={fiatTempValueAtom}
            />
          </Stack>
          <PriceInfo fiatTempValueAtom={fiatTempValueAtom} />
        </Stack>
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        disabled={saveButtonDisabled}
        onPress={() => {
          void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
            saveYourPrice({
              btcValueAtom: btcTempValueAtom,
              fiatValueAtom: fiatTempValueAtom,
            })
            goBack()
          })
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default SetYourOwnPriceScreen
