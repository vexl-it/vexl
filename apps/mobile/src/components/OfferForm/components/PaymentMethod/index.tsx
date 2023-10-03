import useContent from './useContent'
import {
  type LocationState,
  type PaymentMethod,
} from '@vexl-next/domain/dist/general/offers'
import {useAtom, useAtomValue, type PrimitiveAtom} from 'jotai'
import {getTokens, Text, XStack} from 'tamagui'
import SvgImage from '../../../Image'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SelectableCell from '../../../SelectableCell'
import infoSvg from '../../../images/infoSvg'

interface Props {
  locationStateAtom: PrimitiveAtom<LocationState | undefined>
  paymentMethodAtom: PrimitiveAtom<PaymentMethod[] | undefined>
}

function PaymentMethodComponent({
  locationStateAtom,
  paymentMethodAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()
  const tokens = getTokens()
  const [paymentMethod, setPaymentMethod] = useAtom(paymentMethodAtom)
  const locationState = useAtomValue(locationStateAtom)

  const onMethodCellPress = (methodType: PaymentMethod): void => {
    if (
      locationState !== 'IN_PERSON' &&
      paymentMethod?.includes(methodType) &&
      paymentMethod.length > 1
    ) {
      const selectedMethods = paymentMethod.filter(
        (method) => method !== methodType
      )
      setPaymentMethod(selectedMethods)
    } else if (!paymentMethod?.includes(methodType)) {
      setPaymentMethod([...(paymentMethod ?? []), methodType])
    }
  }

  if (!locationState) {
    return (
      <XStack ai={'center'} jc={'center'} gap={'$1'}>
        <SvgImage source={infoSvg} fill={tokens.color.white.val} />
        <Text col={'white'}>
          {t('offerForm.amountOfTransaction.pleaseSelectLocationFirst')}
        </Text>
      </XStack>
    )
  }

  if (locationState === 'IN_PERSON') {
    return (
      <SelectableCell
        key={content[locationState][0].type}
        fullWidth={false}
        selected={
          paymentMethod?.includes(content[locationState][0].type) ?? false
        }
        onPress={onMethodCellPress}
        title={content[locationState][0].title}
        type={content[locationState][0].type}
      />
    )
  }

  return (
    <XStack space="$2" ai="center">
      {content.ONLINE.map((method) => (
        <SelectableCell
          key={method.type}
          fullWidth={false}
          selected={paymentMethod?.includes(method.type) ?? false}
          onPress={onMethodCellPress}
          title={method.title}
          type={method.type}
        />
      ))}
    </XStack>
  )
}

export default PaymentMethodComponent
