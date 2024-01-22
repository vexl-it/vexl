import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Text} from 'tamagui'
import {type TradeChecklistStackParamsList} from '../../../../../../navigationTypes'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import PremiumOrDiscountContent from '../../../../../PremiumOrDiscountContent'
import Content from '../../../Content'
import {
  applyFeeOnFeeChangeActionAtom,
  feeAmountAtom,
  offerTypeAtom,
} from '../../atoms'
import PriceTypeIndicator from '../PriceTypeIndicator'

const tempFeeAmountAtom = atom<number>(0)

function PremiumOrDiscountScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const offerType = useAtomValue(offerTypeAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)
  const [tempFeeAmount, setTempFeeAmount] = useAtom(tempFeeAmountAtom)

  useFocusEffect(
    useCallback(() => {
      setTempFeeAmount(feeAmount)
    }, [feeAmount, setTempFeeAmount])
  )

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.calculateAmount.premiumOrDiscount')}
        onClose={() => {
          navigation.navigate('AgreeOnTradeDetails')
        }}
      />
      <Content scrollable>
        <Text fos={16} mt="$2" mb="$4" col="$greyOnBlack">
          {offerType === 'BUY'
            ? t('offerForm.buyCheaperByUsingDiscount')
            : t('offerForm.sellFasterWithDiscount')}
        </Text>
        <PremiumOrDiscountContent
          proceedToDetailDisabled
          feeAmountAtom={tempFeeAmountAtom}
          offerTypeAtom={offerTypeAtom}
        >
          <PriceTypeIndicator displayInGrayColor mr="$2" />
        </PremiumOrDiscountContent>
      </Content>
      <FooterButtonProxy
        onPress={() => {
          applyFeeOnFeeChange(tempFeeAmount)
          goBack()
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default PremiumOrDiscountScreen
