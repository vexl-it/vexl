import {
  type LocationState,
  type PaymentMethod,
} from '@vexl-next/domain/src/general/offers'
import {useAtom, useAtomValue, type PrimitiveAtom} from 'jotai'
import {Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SvgImage from '../../../Image'
import SelectableCell from '../../../SelectableCell'
import infoSvg from '../../../images/infoSvg'
import useContent from './useContent'

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
      <XStack ai="center" jc="center" gap="$1">
        <SvgImage source={infoSvg} fill={tokens.color.white.val} />
        <Text col="white">
          {t('offerForm.amountOfTransaction.pleaseSelectLocationFirst')}
        </Text>
      </XStack>
    )
  }

  if (locationState === 'IN_PERSON') {
    const contentLocationState0 = content[locationState][0]

    return (
      <SelectableCell
        key={content[locationState][0]?.type}
        fullWidth={false}
        selected={
          !contentLocationState0 ||
          (paymentMethod?.includes(contentLocationState0.type) ?? false)
        }
        onPress={onMethodCellPress}
        title={contentLocationState0?.title ?? ''}
        type={contentLocationState0?.type ?? 'CASH'}
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
